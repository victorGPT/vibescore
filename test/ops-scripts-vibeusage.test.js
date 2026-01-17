const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const repoRoot = path.join(__dirname, "..");

async function read(relPath) {
  return fs.readFile(path.join(repoRoot, relPath), "utf8");
}

test("ops scripts reference VibeUsage defaults", async () => {
  const backfill = await read("scripts/ops/backfill-codex-unknown.cjs");
  const ingest = await read("scripts/ops/ingest-canary.cjs");

  assert.ok(backfill.includes(".vibeusage"), "expected backfill to reference .vibeusage");
  assert.ok(backfill.includes("vibeusage"), "expected backfill to reference vibeusage package");
  assert.ok(!backfill.includes(".vibescore"), "backfill should not reference .vibescore");
  assert.ok(!backfill.includes("@vibescore/tracker"), "backfill should not reference @vibescore/tracker");

  assert.ok(ingest.includes("/functions/vibeusage-ingest"), "expected ingest canary to hit vibeusage endpoint");
  assert.ok(!ingest.includes("/functions/vibescore-ingest"), "ingest canary should not reference vibescore endpoint");
});

test("ops scripts surface supported env fallbacks in error messages", async () => {
  const ingest = await read("scripts/ops/ingest-canary.cjs");
  const billable = await read("scripts/ops/billable-total-tokens-backfill.cjs");

  const ingestMissingMatch = ingest.match(/Missing base URL:[^\n]+/);
  assert.ok(ingestMissingMatch, "expected ingest canary to include a missing base URL message");
  const ingestMissingBaseUrl = ingestMissingMatch[0];
  for (const envName of [
    "VIBEUSAGE_CANARY_BASE_URL",
    "VIBEUSAGE_INSFORGE_BASE_URL",
    "INSFORGE_BASE_URL"
  ]) {
    assert.ok(
      ingestMissingBaseUrl.includes(envName),
      `expected ingest canary missing base URL message to mention ${envName}`
    );
  }

  const billableMissingBaseMatch = billable.match(/Missing base URL:[^\n]+/);
  assert.ok(billableMissingBaseMatch, "expected billable backfill to include a missing base URL message");
  const billableMissingBaseUrl = billableMissingBaseMatch[0];
  for (const envName of ["INSFORGE_BASE_URL", "VIBEUSAGE_INSFORGE_BASE_URL"]) {
    assert.ok(
      billableMissingBaseUrl.includes(envName),
      `expected billable backfill missing base URL message to mention ${envName}`
    );
  }

  const billableMissingRoleMatch = billable.match(/Missing service role key:[^\n]+/);
  assert.ok(billableMissingRoleMatch, "expected billable backfill to include a missing service role message");
  const billableMissingServiceRole = billableMissingRoleMatch[0];
  for (const envName of ["INSFORGE_SERVICE_ROLE_KEY", "VIBEUSAGE_SERVICE_ROLE_KEY"]) {
    assert.ok(
      billableMissingServiceRole.includes(envName),
      `expected billable backfill missing service role message to mention ${envName}`
    );
  }
});
