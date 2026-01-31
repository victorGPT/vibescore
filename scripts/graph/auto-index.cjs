const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { scip } = require('@sourcegraph/scip-typescript/dist/src/scip');

const { loadGraphConfig } = require('./lib/config.cjs');
const { discoverDomains } = require('./lib/domain-discovery.cjs');
const { scanDomainMetrics } = require('./lib/metrics.cjs');
const { decideSplit } = require('./lib/split-decision.cjs');
const { writePlan } = require('./lib/plan-writer.cjs');
const { runScipForPlan } = require('./lib/scip-runner.cjs');
const { importScip } = require('./lib/importer.cjs');
const { validateScipCoverage } = require('./lib/validate.cjs');

function buildPlan({ rootDir, deps = {} }) {
  const fsDep = deps.fs || fs;
  const pathDep = deps.path || path;
  const config = loadGraphConfig({ rootDir, fs: fsDep, path: pathDep });
  const domains = discoverDomains({ rootDir, fs: fsDep, path: pathDep });
  const metrics = scanDomainMetrics({ rootDir, domains, fs: fsDep, path: pathDep });
  const decision = decideSplit({ metrics, thresholds: config.thresholds });

  const selectedDomains = decision.decision === 'split' && domains.length > 0
    ? domains
    : [{ name: 'root', paths: ['.'] }];

  return {
    decision: decision.decision,
    domains: selectedDomains,
    metrics
  };
}

function buildFallbackPlan({ rootDir, plan, deps = {} }) {
  const fsDep = deps.fs || fs;
  const pathDep = deps.path || path;
  if (plan.decision === 'single') {
    const domains = discoverDomains({ rootDir, fs: fsDep, path: pathDep });
    return {
      decision: domains.length > 0 ? 'split' : 'single',
      domains: domains.length > 0 ? domains : [{ name: 'root', paths: ['.'] }],
      fallbackFrom: 'single'
    };
  }
  return {
    decision: 'single',
    domains: [{ name: 'root', paths: ['.'] }],
    fallbackFrom: 'split'
  };
}

function parseScipFile(scipPath) {
  const buf = fs.readFileSync(scipPath);
  return scip.Index.deserialize(buf);
}

function main() {
  const rootDir = process.cwd();
  const apply = process.argv.includes('--apply');
  const config = loadGraphConfig({ rootDir, fs, path });

  const plan = buildPlan({ rootDir });
  const planRecord = { ...plan, fallbackDecision: 'none' };
  writePlan({ rootDir, plan: planRecord, fs });

  if (!apply) {
    return;
  }

  let scipOutputs = runScipForPlan({
    rootDir,
    plan,
    deps: { fs, path, execFileSync }
  });

  for (const output of scipOutputs) {
    importScip({
      rootDir,
      scipPath: output.scipPath,
      deps: { fs, path, execFileSync }
    });
  }

  let validation = validateScipCoverage({
    scipOutputs,
    thresholds: { maxNoiseRatio: config.thresholds.maxNoiseRatio },
    deps: { parseScipFile }
  });

  if (!validation.ok) {
    const fallbackPlan = buildFallbackPlan({ rootDir, plan });
    planRecord.fallbackDecision = fallbackPlan.decision;
    writePlan({ rootDir, plan: planRecord, fs });

    scipOutputs = runScipForPlan({
      rootDir,
      plan: fallbackPlan,
      deps: { fs, path, execFileSync }
    });

    for (const output of scipOutputs) {
      importScip({
        rootDir,
        scipPath: output.scipPath,
        deps: { fs, path, execFileSync }
      });
    }

    validation = validateScipCoverage({
      scipOutputs,
      thresholds: { maxNoiseRatio: config.thresholds.maxNoiseRatio },
      deps: { parseScipFile }
    });

    if (!validation.ok) {
      throw new Error(`Auto-index validation failed: ${JSON.stringify(validation.failures)}`);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildPlan };
