const assert = require("node:assert/strict");
const { test } = require("node:test");

test("trimLeadingZeroMonths removes leading zero months and keeps later zeros", async () => {
  const mod = await import("../dashboard/src/lib/details.js");
  const { trimLeadingZeroMonths } = mod;

  const rows = [
    {
      month: "2025-08",
      total_tokens: "0",
      input_tokens: "0",
      cached_input_tokens: "0",
      output_tokens: "0",
      reasoning_output_tokens: "0",
    },
    {
      month: "2025-09",
      total_tokens: "0",
      input_tokens: "0",
      cached_input_tokens: "0",
      output_tokens: "0",
      reasoning_output_tokens: "0",
    },
    {
      month: "2025-10",
      total_tokens: "5",
      input_tokens: "3",
      cached_input_tokens: "0",
      output_tokens: "2",
      reasoning_output_tokens: "0",
    },
    {
      month: "2025-11",
      total_tokens: "0",
      input_tokens: "0",
      cached_input_tokens: "0",
      output_tokens: "0",
      reasoning_output_tokens: "0",
    },
  ];

  const trimmed = trimLeadingZeroMonths(rows);
  assert.equal(trimmed.length, 2);
  assert.equal(trimmed[0].month, "2025-10");
  assert.equal(trimmed[1].month, "2025-11");
});

test("trimLeadingZeroMonths keeps all rows when no non-zero months", async () => {
  const mod = await import("../dashboard/src/lib/details.js");
  const { trimLeadingZeroMonths } = mod;

  const rows = [
    { month: "2025-08", total_tokens: "0" },
    { month: "2025-09", total_tokens: "0" },
  ];

  const trimmed = trimLeadingZeroMonths(rows);
  assert.deepEqual(
    trimmed.map((row) => row.month),
    rows.map((row) => row.month)
  );
});
