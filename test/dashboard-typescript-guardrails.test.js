const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const repoRoot = path.join(__dirname, "..");
const tsconfigPath = path.join(repoRoot, "dashboard/tsconfig.json");
const pkgPath = path.join(repoRoot, "dashboard/package.json");
const eslintPath = path.join(repoRoot, "dashboard/.eslintrc.cjs");

async function read(pathname) {
  return fs.readFile(pathname, "utf8");
}

test("dashboard has tsconfig", async () => {
  await read(tsconfigPath);
});

test("vite env types are declared", async () => {
  const viteEnv = await read(path.join(repoRoot, "dashboard/src/vite-env.d.ts"));
  assert.ok(viteEnv.includes("vite/client"), "expected vite client types reference");
});

test("dashboard package defines typecheck", async () => {
  const pkg = JSON.parse(await read(pkgPath));
  assert.ok(pkg.scripts?.typecheck, "expected typecheck script");
});

test("eslint uses typescript parser", async () => {
  const eslint = await read(eslintPath);
  assert.ok(eslint.includes("@typescript-eslint/parser"));
});
