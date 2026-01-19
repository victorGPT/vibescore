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
  const reactImportMatch = source.match(
    /import\s+React\s*,\s*\{([^}]+)\}\s+from\s+["']react["']\s*;/
  );
  assert.ok(reactImportMatch, "expected React named imports in App.jsx");
  const namedImports = reactImportMatch[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  assert.ok(
    namedImports.includes("useRef"),
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
