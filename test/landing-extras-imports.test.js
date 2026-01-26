const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("LandingExtras uses correct relative imports after relocation", () => {
  const src = fs.readFileSync(
    path.join(
      __dirname,
      "../dashboard/src/ui/matrix-a/components/LandingExtras.jsx"
    ),
    "utf8"
  );

  assert.ok(src.includes('from "../../foundation/MatrixAvatar.jsx"'));
  assert.ok(src.includes('from "./LiveSniffer.jsx"'));
  assert.ok(src.includes('from "../../foundation/SignalBox.jsx"'));
  assert.ok(src.includes('from "../../../lib/copy.js"'));
});
