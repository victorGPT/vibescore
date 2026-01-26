const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const copyPath = path.join(root, "dashboard", "src", "content", "copy.csv");
const landingViewPath = path.join(
  root,
  "dashboard",
  "src",
  "ui",
  "matrix-a",
  "views",
  "LandingView.jsx"
);

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function hasCopyKey(csv, key) {
  return csv.startsWith(`${key},`) || csv.includes(`\n${key},`);
}

test("landing CTA copy keys exist", () => {
  const csv = read(copyPath);
  const requiredKeys = ["landing.cta.primary", "landing.cta.secondary"];

  for (const key of requiredKeys) {
    assert.ok(
      hasCopyKey(csv, key),
      `expected copy registry to include ${key}`
    );
  }
});

test("LandingView uses CTA copy keys", () => {
  const source = read(landingViewPath);
  const requiredKeys = ["landing.cta.primary", "landing.cta.secondary"];

  for (const key of requiredKeys) {
    assert.ok(
      source.includes(`copy(\"${key}\"`),
      `expected LandingView to use copy key ${key}`
    );
  }
});
