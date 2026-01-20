const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const repoRoot = path.join(__dirname, "..");
const dashboardPackageJson = path.join(repoRoot, "dashboard/package.json");
const dashboardEslintConfig = path.join(repoRoot, "dashboard/.eslintrc.cjs");

async function readDashboardPackage() {
  const content = await fs.readFile(dashboardPackageJson, "utf8");
  return JSON.parse(content);
}

async function readEslintConfig() {
  return fs.readFile(dashboardEslintConfig, "utf8");
}

test("dashboard package defines lint script", async () => {
  const pkg = await readDashboardPackage();
  assert.ok(pkg.scripts, "expected dashboard package.json scripts to exist");
  assert.ok(
    typeof pkg.scripts.lint === "string" && pkg.scripts.lint.length > 0,
    "expected dashboard package.json to define a lint script"
  );
  assert.ok(
    pkg.scripts.lint.includes("src/**/*.{js,jsx,ts,tsx}"),
    "expected dashboard lint script to target src/**/*.{js,jsx,ts,tsx}"
  );
});

test("dashboard package includes eslint devDependencies", async () => {
  const pkg = await readDashboardPackage();
  const devDeps = pkg.devDependencies ?? {};
  assert.ok(
    typeof devDeps.eslint === "string",
    "expected eslint to be listed in dashboard devDependencies"
  );
  assert.ok(
    typeof devDeps["eslint-plugin-react"] === "string",
    "expected eslint-plugin-react to be listed in dashboard devDependencies"
  );
  assert.ok(
    typeof devDeps["eslint-plugin-react-hooks"] === "string",
    "expected eslint-plugin-react-hooks to be listed in dashboard devDependencies"
  );
});

test("dashboard eslint config exists and enables recommended rules", async () => {
  const config = await readEslintConfig();
  assert.ok(
    config.includes("eslint:recommended"),
    "expected eslint config to extend eslint:recommended"
  );
  assert.ok(
    config.includes("plugin:react-hooks/recommended"),
    "expected eslint config to extend react hooks recommended rules"
  );
});
