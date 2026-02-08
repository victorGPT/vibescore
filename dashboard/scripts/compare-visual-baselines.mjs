import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import pixelmatch from "pixelmatch";
import * as pngjs from "pngjs";

import { createBaselineJobs } from "./visual-baseline-config.js";

const { PNG } = pngjs;
const exec = promisify(execFile);

function readArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function resolveFromRepoRoot(repoRoot, p) {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.resolve(repoRoot, p);
}

function toSafeTimestamp(date) {
  // Example: 2026-02-07T23-18-05-123Z
  return date.toISOString().replace(/[:.]/g, "-");
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function isDevServerReachable(baseUrl, timeoutMs) {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/`, timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}

function parseBaseUrl(baseUrl) {
  const url = new URL(baseUrl);
  const port = url.port
    ? Number(url.port)
    : url.protocol === "https:"
      ? 443
      : 80;
  return {
    hostname: url.hostname,
    port,
  };
}

function isLocalhostHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function startDashboardDevServer(repoRoot, port) {
  const child = spawn(
    npmCommand(),
    ["--prefix", "dashboard", "run", "dev", "--", "--port", String(port), "--strictPort"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      detached: process.platform !== "win32",
    }
  );
  return child;
}

async function stopDashboardDevServer(child) {
  if (!child) return;
  if (child.exitCode !== null) return;

  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, "SIGTERM");
      return;
    } catch {
      // fall through
    }
  }

  try {
    child.kill("SIGTERM");
  } catch {
    // ignore
  }
}

async function waitForDashboardDevServer(baseUrl, child, { timeoutMs, intervalMs }) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child?.exitCode !== null) {
      throw new Error(
        `Dev server exited early with code ${child.exitCode ?? "unknown"} (base URL: ${baseUrl}).`
      );
    }

    if (await isDevServerReachable(baseUrl, 750)) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for dev server at ${baseUrl}.`);
}

async function readPng(filePath) {
  const buf = await fs.readFile(filePath);
  return PNG.sync.read(buf);
}

function padPng(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function printHelp() {
  const lines = [
    "Compare current dashboard screenshots against visual baselines.",
    "",
    "Usage:",
    "  node dashboard/scripts/compare-visual-baselines.mjs [options]",
    "",
    "Options:",
    "  --base-url <url>       Base URL for the dashboard (default: http://localhost:5173)",
    "                         Env override: VIBEUSAGE_DASHBOARD_BASE_URL",
    "  --baseline-dir <dir>   Baseline directory (default: docs/screenshots/baselines/2026-01-23)",
    "  --no-start-server      Do not auto-start the Vite dev server when base-url is localhost",
    "  --help                 Show help",
    "",
    "Outputs:",
    "  Current screenshots: dashboard/tmp/visual-baselines/<timestamp>/current/<name>.png",
    "  Diff screenshots:    dashboard/tmp/visual-baselines/<timestamp>/diff/<name>.png",
  ];
  console.log(lines.join("\n"));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const baseUrl = normalizeBaseUrl(
  readArg("--base-url", process.env.VIBEUSAGE_DASHBOARD_BASE_URL) ||
    "http://localhost:5173"
);
const baselineDir = resolveFromRepoRoot(
  repoRoot,
  readArg("--baseline-dir", "docs/screenshots/baselines/2026-01-23")
);

const script = path.resolve(repoRoot, "dashboard/scripts/capture-dashboard-screenshot.mjs");

async function captureJob(job, outPath) {
  await exec(
    "node",
    [
      script,
      "--url",
      job.url,
      "--out",
      outPath,
      "--width",
      String(job.width),
      "--height",
      String(job.height),
      "--dpr",
      String(job.dpr),
      "--wait",
      "1200",
      "--no-full-page",
    ],
    { cwd: repoRoot }
  );
}

async function run() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp();
    return;
  }

  const jobs = createBaselineJobs(baseUrl);
  const { hostname, port } = parseBaseUrl(baseUrl);
  const shouldStartServer = !hasFlag("--no-start-server") && isLocalhostHost(hostname);
  const serverRunning = await isDevServerReachable(baseUrl, 750);
  let devServer = null;

  if (!serverRunning && shouldStartServer) {
    console.log(`Dev server is not running at ${baseUrl}. Starting Vite on port ${port}...`);
    devServer = startDashboardDevServer(repoRoot, port);
    try {
      await waitForDashboardDevServer(baseUrl, devServer, {
        timeoutMs: 30_000,
        intervalMs: 250,
      });
    } catch (error) {
      await stopDashboardDevServer(devServer);
      throw error;
    }
  }

  const timestamp = toSafeTimestamp(new Date());
  const runDir = path.resolve(
    repoRoot,
    "dashboard/tmp/visual-baselines",
    timestamp
  );
  const currentDir = path.join(runDir, "current");
  const diffDir = path.join(runDir, "diff");

  await fs.mkdir(currentDir, { recursive: true });
  await fs.mkdir(diffDir, { recursive: true });

  const matched = [];
  const mismatched = [];

  try {
    for (const job of jobs) {
      const baselinePath = path.join(baselineDir, `${job.name}.png`);
      const currentPath = path.join(currentDir, `${job.name}.png`);
      const diffPath = path.join(diffDir, `${job.name}.png`);

      try {
        await captureJob(job, currentPath);
      } catch (error) {
        const err = new Error(
          [
            `Failed to capture screenshot for job "${job.name}".`,
            `URL: ${job.url}`,
            `Output: ${currentPath}`,
            "",
            `Is the dev server running at ${baseUrl}?`,
          ].join("\n")
        );
        // Preserve structured details from execFile errors (stdout/stderr/code).
        // @ts-ignore
        err.cause = error;
        throw err;
      }

      try {
        await fs.access(baselinePath);
      } catch {
        mismatched.push({
          name: job.name,
          reason: "missing-baseline",
          baselinePath,
          currentPath,
          diffPath: null,
        });
        console.log(`DIFF ${job.name} (missing baseline)`);
        continue;
      }

      const baselinePng = await readPng(baselinePath);
      const currentPng = await readPng(currentPath);

      const width = Math.max(baselinePng.width, currentPng.width);
      const height = Math.max(baselinePng.height, currentPng.height);

      const baselinePadded = padPng(baselinePng, width, height);
      const currentPadded = padPng(currentPng, width, height);
      const diffPng = new PNG({ width, height });

      const diffPixels = pixelmatch(
        baselinePadded.data,
        currentPadded.data,
        diffPng.data,
        width,
        height,
        { threshold: 0.1 }
      );

      if (diffPixels === 0) {
        matched.push({ name: job.name, baselinePath, currentPath });
        console.log(`OK ${job.name}`);
        continue;
      }

      await fs.writeFile(diffPath, PNG.sync.write(diffPng));
      mismatched.push({
        name: job.name,
        reason: "pixel-diff",
        baselinePath,
        currentPath,
        diffPath,
        diffPixels,
      });
      console.log(`DIFF ${job.name} (${diffPixels} px)`);
    }
  } finally {
    await stopDashboardDevServer(devServer);
  }

  console.log("");
  console.log(
    `Visual baselines: ${matched.length} matched, ${mismatched.length} mismatched`
  );

  if (mismatched.length > 0) {
    for (const item of mismatched) {
      console.log("");
      console.log(`Mismatch: ${item.name}`);
      console.log(`Baseline: ${item.baselinePath}`);
      console.log(`Current:  ${item.currentPath}`);
      if (item.diffPath) {
        console.log(`Diff:     ${item.diffPath}`);
      }
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Failed to compare visual baselines.");
  const printAnyError = (err) => {
    if (!err || typeof err !== "object") {
      console.error(err);
      return;
    }
    const anyErr = /** @type {any} */ (err);
    if (anyErr.code) console.error(`code: ${anyErr.code}`);
    if (anyErr.message) console.error(anyErr.message);
    if (anyErr.stderr) console.error(String(anyErr.stderr).trim());
  };
  printAnyError(error);
  // @ts-ignore
  printAnyError(error?.cause);
  process.exitCode = 1;
});
