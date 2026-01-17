const os = require('node:os');
const path = require('node:path');

const { readJsonStrict, writeFileAtomic, chmod600IfPossible } = require('../lib/fs');
const { resolveTrackerPaths } = require('../lib/tracker-paths');
const { collectTrackerDiagnostics } = require('../lib/diagnostics');
const { resolveRuntimeConfig } = require('../lib/runtime-config');
const { buildDoctorReport } = require('../lib/doctor');

async function cmdDoctor(argv = []) {
  const opts = parseArgs(argv);
  const home = os.homedir();
  const { trackerDir } = await resolveTrackerPaths({ home });
  const configPath = path.join(trackerDir, 'config.json');

  const configStatus = await readJsonStrict(configPath);
  const config = configStatus.status === 'ok' && isPlainObject(configStatus.value) ? configStatus.value : {};
  const runtime = resolveRuntimeConfig({ cli: { baseUrl: opts.baseUrl }, config, env: process.env });
  const diagnostics = await collectTrackerDiagnostics({ home });
  const cliPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

  const report = await buildDoctorReport({
    runtime,
    diagnostics,
    fetch: globalThis.fetch,
    paths: {
      trackerDir,
      configPath,
      cliPath
    }
  });

  const jsonOutput = opts.json || Boolean(opts.out);
  const payload = JSON.stringify(report, null, jsonOutput ? 2 : 0) + '\n';

  if (opts.out) {
    const outPath = path.resolve(process.cwd(), opts.out);
    await writeFileAtomic(outPath, payload);
    await chmod600IfPossible(outPath);
    process.stderr.write(`Wrote doctor report to: ${outPath}\n`);
  }

  if (jsonOutput) {
    process.stdout.write(payload);
  } else {
    process.stdout.write(renderHumanReport(report));
  }

  if (report.summary.critical > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const out = { json: false, out: null, baseUrl: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--out') out.out = argv[++i] || null;
    else if (arg === '--base-url') out.baseUrl = argv[++i] || null;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return out;
}

function renderHumanReport(report) {
  const lines = [];
  lines.push('Doctor report');
  lines.push('');
  for (const check of report.checks || []) {
    lines.push(formatCheckLine(check));
  }
  lines.push('');
  lines.push(
    `Summary: ok ${report.summary.ok} | warn ${report.summary.warn} | fail ${report.summary.fail} | critical ${report.summary.critical}`
  );
  lines.push('');
  return lines.join('\n');
}

function formatCheckLine(check = {}) {
  const status = String(check.status || 'unknown').toUpperCase();
  const detail = check.detail ? ` - ${check.detail}` : '';
  return `- [${status}] ${check.id || 'unknown'}${detail}`;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

module.exports = { cmdDoctor };
