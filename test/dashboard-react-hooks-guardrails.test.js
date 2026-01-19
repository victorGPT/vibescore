const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const repoRoot = path.join(__dirname, "..");
const appPath = path.join(repoRoot, "dashboard/src/App.jsx");

async function readAppSource() {
  return fs.readFile(appPath, "utf8");
}

test("App.jsx imports useRef from react", async () => {
  const source = await readAppSource();
  const hasUseRefImport =
    /import\s+[^;]*\{\s*[^}]*\buseRef\b[^}]*\}\s+from\s+["']react["']\s*;/.test(
      source
    );
  assert.ok(
    hasUseRefImport,
    "expected useRef to be imported from react in App.jsx"
  );
});

test("App.jsx wires sessionExpired state from auth storage", async () => {
  const source = await readAppSource();
  assert.ok(
    source.includes("loadSessionExpired"),
    "expected App.jsx to reference loadSessionExpired"
  );
  assert.ok(
    source.includes("subscribeSessionExpired"),
    "expected App.jsx to reference subscribeSessionExpired"
  );
  assert.ok(
    /const\s+\[\s*sessionExpired\s*,\s*setSessionExpired\s*\]\s*=\s*useState/.test(
      source
    ),
    "expected sessionExpired state to be initialized via useState"
  );
});
