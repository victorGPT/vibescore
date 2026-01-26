const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePath = pathToFileURL(
  path.resolve("dashboard/scripts/visual-baseline-config.js")
).href;

test("baseline jobs use screenshot for landing and mock for dashboard", async () => {
  const { createBaselineJobs } = await import(modulePath);
  const jobs = createBaselineJobs("http://localhost:5173");

  const landing = jobs.find((job) => job.name === "landing-desktop");
  const dashboardDesktop = jobs.find((job) => job.name === "dashboard-desktop");
  const dashboardMobile = jobs.find((job) => job.name === "dashboard-mobile");

  assert.ok(landing, "landing-desktop job exists");
  assert.ok(dashboardDesktop, "dashboard-desktop job exists");
  assert.ok(dashboardMobile, "dashboard-mobile job exists");

  assert.ok(landing.url.includes("screenshot=1"));
  assert.ok(!landing.url.includes("mock=1"));
  assert.ok(dashboardDesktop.url.includes("screenshot=1"));
  assert.ok(dashboardDesktop.url.includes("mock=1"));
  assert.ok(dashboardMobile.url.includes("screenshot=1"));
  assert.ok(dashboardMobile.url.includes("mock=1"));
});
