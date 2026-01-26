const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const containerPath = path.join(
  __dirname,
  "..",
  "dashboard",
  "src",
  "pages",
  "DashboardPage.jsx"
);
const viewPath = path.join(
  __dirname,
  "..",
  "dashboard",
  "src",
  "ui",
  "matrix-a",
  "views",
  "DashboardView.jsx"
);
const copyPath = path.join(
  __dirname,
  "..",
  "dashboard",
  "src",
  "content",
  "copy.csv"
);

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("DashboardPage places TrendMonitor above heatmap in left column", () => {
  const src = readFile(viewPath);
  const leftStart = src.indexOf("lg:col-span-4");
  const rightStart = src.indexOf("lg:col-span-8", leftStart + 1);
  assert.ok(leftStart !== -1, "expected left column markup");
  assert.ok(rightStart !== -1, "expected right column markup");

  const leftColumn = src.slice(leftStart, rightStart);
  const trendIndex = leftColumn.indexOf("<TrendMonitor");
  const heatmapIndex = leftColumn.indexOf("{activityHeatmapBlock}");
  assert.ok(trendIndex !== -1, "expected TrendMonitor in left column");
  assert.ok(heatmapIndex !== -1, "expected heatmap block in left column");
  assert.ok(
    trendIndex < heatmapIndex,
    "expected TrendMonitor above heatmap in left column"
  );
});

test("DashboardPage gates install panel by active days", () => {
  const containerSrc = readFile(containerPath);
  const viewSrc = readFile(viewPath);
  assert.ok(
    containerSrc.includes("const shouldShowInstall"),
    "expected shouldShowInstall gate"
  );
  assert.ok(
    containerSrc.includes("activeDays === 0"),
    "expected activeDays gate"
  );
  assert.ok(
    containerSrc.includes("accessEnabled"),
    "expected accessEnabled gate"
  );
  assert.ok(
    containerSrc.includes("heatmapLoading"),
    "expected heatmapLoading gate"
  );
  assert.ok(
    viewSrc.includes("shouldShowInstall ? ("),
    "expected install panel to use shouldShowInstall"
  );
});

test("DashboardPage removes heatmap range label", () => {
  const src = readFile(viewPath);
  assert.ok(
    !src.includes("dashboard.activity.range"),
    "expected heatmap range label removed"
  );
});

test("copy registry removes unused install steps and range label", () => {
  const csv = readFile(copyPath);
  const removed = [
    "dashboard.install.headline",
    "dashboard.install.step1",
    "dashboard.install.step2",
    "dashboard.install.step3",
    "dashboard.activity.range",
  ];
  for (const key of removed) {
    assert.ok(!csv.includes(key), `expected copy key removed: ${key}`);
  }
});

test("DashboardPage lets TrendMonitor auto-size", () => {
  const src = readFile(viewPath);
  assert.ok(
    !src.includes('className="min-h-[240px]"'),
    "expected TrendMonitor min height removed"
  );
  assert.ok(
    src.includes('className="h-auto min-h-[280px]"'),
    "expected TrendMonitor to override h-full with h-auto"
  );
});

test("TrendMonitor root does not force full height", () => {
  const src = readFile(
    path.join(
      __dirname,
      "..",
      "dashboard",
      "src",
      "ui",
      "matrix-a",
      "components",
      "TrendMonitor.jsx"
    )
  );
  const lines = src.split("\n");
  const rootLine = lines.find((line) => line.includes("className={`w-full"));
  assert.ok(rootLine, "expected TrendMonitor root className line");
  assert.ok(
    !rootLine.includes("h-full"),
    "expected TrendMonitor root to avoid h-full"
  );
});

test("DashboardPage supports force_install preview", () => {
  const src = readFile(containerPath);
  assert.ok(
    src.includes("force_install"),
    "expected force_install query param support"
  );
  assert.ok(
    src.includes("isProductionHost"),
    "expected force_install gated by production host check"
  );
  assert.ok(
    src.includes("forceInstall"),
    "expected forceInstall flag to influence install visibility"
  );
});
