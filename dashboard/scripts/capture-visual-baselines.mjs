import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const baseUrl = "http://localhost:5173";
const mock =
  "mock=1&mock_seed=baseline&mock_today=2025-12-31&mock_now=2025-12-31T12:00:00Z";

const jobs = [
  {
    name: "dashboard-desktop",
    url: `${baseUrl}/?screenshot=1&${mock}`,
    width: 1512,
    height: 997,
    dpr: 2,
  },
  {
    name: "dashboard-mobile",
    url: `${baseUrl}/?screenshot=1&${mock}`,
    width: 390,
    height: 844,
    dpr: 2,
  },
  {
    name: "landing-desktop",
    url: `${baseUrl}/?${mock}`,
    width: 1440,
    height: 900,
    dpr: 2,
  },
];

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
