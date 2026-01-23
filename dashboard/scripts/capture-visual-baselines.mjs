import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { createBaselineJobs } from "./visual-baseline-config.js";

const exec = promisify(execFile);

const baseUrl = "http://localhost:5173";

const jobs = createBaselineJobs(baseUrl);

const outDir = path.resolve("docs/screenshots/baselines/2026-01-23");
const script = path.resolve("dashboard/scripts/capture-dashboard-screenshot.mjs");

async function run() {
  for (const job of jobs) {
    const out = path.join(outDir, `${job.name}.png`);
    await exec("node", [
      script,
      "--url",
      job.url,
      "--out",
      out,
      "--width",
      String(job.width),
      "--height",
      String(job.height),
      "--dpr",
      String(job.dpr),
      "--wait",
      "1200",
    ]);
    console.log(`Captured ${job.name}: ${out}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
