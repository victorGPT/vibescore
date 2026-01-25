const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  extractJsxTextTokens,
  diffAgainstBaseline
} = require("../scripts/ops/validate-ui-hardcode-lib.cjs");

test("extractJsxTextTokens includes unicode letters and digits", () => {
  const tokens = extractJsxTextTokens("<div>123</div><span>中文</span><p>abc</p>");
  assert.deepEqual(tokens, ["123", "中文", "abc"]);
});

test("diffAgainstBaseline flags new rawText tokens even if count unchanged", () => {
  const current = {
    files: {
      "dashboard/src/ui/Foo.tsx": {
        colors: 0,
        rawText: 1,
        rawTextTokens: ["Hello world"]
      }
    }
  };
  const baseline = {
    files: {
      "dashboard/src/ui/Foo.tsx": {
        colors: 0,
        rawText: 1,
        rawTextTokens: ["Hello"]
      }
    }
  };

  const errors = diffAgainstBaseline(current, baseline);
  assert.ok(
    errors.some((line) => line.includes("rawText tokens introduced")),
    `expected rawText token diff, got:\n${errors.join("\n")}`
  );
});
