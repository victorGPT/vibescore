const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const cp = require('node:child_process');
const { test } = require('node:test');

const { cmdInit } = require('../src/commands/init');

async function runNotify(notifyPath, env) {
  await new Promise((resolve, reject) => {
    const child = cp.execFile(process.execPath, [notifyPath, '--source=codex'], { env }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function setupInitEnv() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-notify-debug-'));
  const prevHome = process.env.HOME;
  const prevCodexHome = process.env.CODEX_HOME;
  const prevToken = process.env.VIBEUSAGE_DEVICE_TOKEN;
  const prevOpencodeConfigDir = process.env.OPENCODE_CONFIG_DIR;

  process.env.HOME = tmp;
  process.env.CODEX_HOME = path.join(tmp, '.codex');
  delete process.env.VIBEUSAGE_DEVICE_TOKEN;
  process.env.OPENCODE_CONFIG_DIR = path.join(tmp, '.config', 'opencode');
  await fs.mkdir(process.env.CODEX_HOME, { recursive: true });

  await cmdInit(['--yes', '--no-auth', '--no-open', '--base-url', 'https://example.invalid']);

  const notifyPath = path.join(tmp, '.vibeusage', 'bin', 'notify.cjs');
  const trackerDir = path.join(tmp, '.vibeusage', 'tracker');
  const debugLogPath = path.join(trackerDir, 'notify.debug.jsonl');
  await fs.mkdir(trackerDir, { recursive: true });
  await fs.writeFile(path.join(trackerDir, 'config.json'), '{}', 'utf8');

  return {
    tmp,
    notifyPath,
    trackerDir,
    debugLogPath,
    cleanup: async () => {
      if (prevHome === undefined) delete process.env.HOME;
      else process.env.HOME = prevHome;
      if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = prevCodexHome;
      if (prevToken === undefined) delete process.env.VIBEUSAGE_DEVICE_TOKEN;
      else process.env.VIBEUSAGE_DEVICE_TOKEN = prevToken;
      if (prevOpencodeConfigDir === undefined) delete process.env.OPENCODE_CONFIG_DIR;
      else process.env.OPENCODE_CONFIG_DIR = prevOpencodeConfigDir;
      await fs.rm(tmp, { recursive: true, force: true });
    }
  };
}

test('notify debug log is gated and capped by env settings', async () => {
  const gatedContext = await setupInitEnv();
  try {
    await assert.rejects(fs.stat(gatedContext.debugLogPath), /ENOENT/);
    await runNotify(gatedContext.notifyPath, { ...process.env });
    await assert.rejects(fs.stat(gatedContext.debugLogPath), /ENOENT/);
  } finally {
    await gatedContext.cleanup();
  }

  const cappedContext = await setupInitEnv();
  try {
    const env = {
      ...process.env,
      VIBEUSAGE_NOTIFY_DEBUG: '1',
      VIBEUSAGE_NOTIFY_DEBUG_MAX_BYTES: '64'
    };

    await runNotify(cappedContext.notifyPath, env);
    const first = await fs.readFile(cappedContext.debugLogPath, 'utf8');
    assert.ok(first.length > 0);

    const limit = 64;
    const filler = 'x'.repeat(limit);
    await fs.writeFile(cappedContext.debugLogPath, filler, 'utf8');
    await runNotify(cappedContext.notifyPath, env);
    const after = await fs.readFile(cappedContext.debugLogPath, 'utf8');
    assert.equal(after, filler);
  } finally {
    await cappedContext.cleanup();
  }
});
