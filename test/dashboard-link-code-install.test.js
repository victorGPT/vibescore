const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const copyPath = path.join(__dirname, "..", "dashboard", "src", "content", "copy.csv");
const pagePath = path.join(
  __dirname,
  "..",
  "dashboard",
  "src",
  "pages",
  "DashboardPage.jsx"
);

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("copy registry includes link code install keys", () => {
  const csv = readFile(copyPath);
  const required = [
    "dashboard.install.cmd.init_link_code",
    "dashboard.install.copy",
    "dashboard.install.copy_base",
    "dashboard.install.copied",
    "dashboard.install.link_code.loading",
    "dashboard.install.link_code.failed",
  ];
  for (const key of required) {
    assert.ok(csv.includes(key), `missing copy key: ${key}`);
  }
});

test("DashboardPage omits link code install copy flow", () => {
  const src = readFile(pagePath);
  assert.ok(
    src.includes("dashboard.install.cmd.init"),
    "expected base install command usage"
  );
  assert.ok(
    src.includes("const installInitCmdDisplay = installInitCmdBase;"),
    "expected install display to stay on base command"
  );
  assert.ok(
    !src.includes("dashboard.install.cmd.init_link_code"),
    "expected link code copy command to be removed"
  );
  assert.ok(
    !src.includes("dashboard.install.copy"),
    "expected install copy labels to be removed"
  );
  assert.ok(
    !src.includes("handleCopyInstall"),
    "expected install copy handler to be removed"
  );
});
