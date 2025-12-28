const assert = require("node:assert/strict");
const { test } = require("node:test");

test("formatCompactNumber rounds and carries", async () => {
  const mod = await import("../dashboard/src/lib/format.js");
  const formatCompactNumber = mod.formatCompactNumber;

  assert.equal(typeof formatCompactNumber, "function");

  assert.equal(formatCompactNumber(999), "999");
  assert.equal(formatCompactNumber(1000), "1K");
  assert.equal(formatCompactNumber(1200), "1.2K");
  assert.equal(formatCompactNumber(999949), "999.9K");
  assert.equal(formatCompactNumber(999950), "1M");
  assert.equal(formatCompactNumber(1000000), "1M");
  assert.equal(formatCompactNumber(1250000), "1.3M");
  assert.equal(formatCompactNumber(999950000), "1B");
  assert.equal(formatCompactNumber(1000000000), "1B");
  assert.equal(formatCompactNumber(1250000000), "1.3B");
});
