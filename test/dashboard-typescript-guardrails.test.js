const assert = require("node:assert/strict");
const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const repoRoot = path.join(__dirname, "..");
const tsconfigPath = path.join(repoRoot, "dashboard/tsconfig.json");
const pkgPath = path.join(repoRoot, "dashboard/package.json");
const eslintPath = path.join(repoRoot, "dashboard/.eslintrc.cjs");
const dashboardPackage = require(pkgPath);

async function read(pathname) {
  return fs.readFile(pathname, "utf8");
}

function getTscCommand() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const typescriptVersion =
    dashboardPackage.devDependencies?.typescript ??
    dashboardPackage.dependencies?.typescript;
  const typescriptSpecifier = typescriptVersion
    ? `typescript@${typescriptVersion}`
    : "typescript";
  return {
    cmd: npmCmd,
    args: [
      "exec",
      "--package",
      typescriptSpecifier,
      "tsc",
      "--",
      "--noEmit",
      "--pretty",
      "false",
      "-p",
      "dashboard/tsconfig.json",
    ],
  };
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

test("hooks and core lib files are migrated to TS", async () => {
  for (const file of [
    "dashboard/src/hooks/use-backend-status.ts",
    "dashboard/src/hooks/use-activity-heatmap.ts",
    "dashboard/src/hooks/use-usage-data.ts",
    "dashboard/src/hooks/use-trend-data.ts",
    "dashboard/src/hooks/use-usage-model-breakdown.ts",
    "dashboard/src/lib/vibeusage-api.ts",
    "dashboard/src/ui/matrix-a/components/MatrixConstants.ts",
  ]) {
    await fs.readFile(path.join(repoRoot, file));
  }
});

test("lib layer is fully migrated to TS", async () => {
  const libFiles = [
    "auth-storage",
    "auth-redirect",
    "details",
    "activity-heatmap",
    "usage-aggregate",
    "daily",
    "insforge-client",
    "http-timeout",
    "timezone",
    "npm-version",
    "config",
    "insforge-auth-client",
    "mock-data",
    "date-range",
    "copy",
    "safe-browser",
    "format",
    "model-breakdown",
    "backend-probe-scheduler",
    "detail-sort",
  ];

  for (const name of libFiles) {
    await fs.readFile(path.join(repoRoot, `dashboard/src/lib/${name}.ts`));
  }
});

test("tsc command uses npm exec", () => {
  const { cmd, args } = getTscCommand();
  assert.ok(cmd.includes("npm"), "expected npm command");
  assert.ok(args.includes("exec"), "expected npm exec usage");
  assert.ok(args.includes("--package"), "expected npm exec package usage");
  assert.ok(
    args.some((arg) => arg.startsWith("typescript")),
    "expected typescript package specifier",
  );
  assert.ok(args.includes("tsc"), "expected tsc in args");
});

test("tsc validates migrated TS files", async () => {
  const { cmd, args } = getTscCommand();
  await execFileAsync(cmd, args, { cwd: repoRoot });
});
