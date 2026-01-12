const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

test("wrapped entry is removed from dashboard header", () => {
  const src = read("dashboard/src/pages/DashboardPage.jsx");
  assert.doesNotMatch(src, /wrappedEntryLabel/);
  assert.doesNotMatch(src, /showWrappedEntry/);
  assert.doesNotMatch(src, /Wrapped 2025/i);
});

test("annual poster module is removed", () => {
  const appSrc = read("dashboard/src/App.jsx");
  assert.doesNotMatch(appSrc, /AnnualPosterPage/);
  assert.doesNotMatch(appSrc, /poster/);
  const posterPath = path.join(
    __dirname,
    "..",
    "dashboard/src/pages/AnnualPosterPage.jsx"
  );
  assert.equal(fs.existsSync(posterPath), false);
});

test("copy registry does not include wrapped entry", () => {
  const src = read("dashboard/src/content/copy.csv");
  assert.doesNotMatch(src, /dashboard\.wrapped\.entry/);
});
