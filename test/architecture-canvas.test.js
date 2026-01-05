const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

const {
  classifyFile,
  pruneEdges,
  aggregateNodesIfNeeded,
  buildCanvasModel,
} = require("../scripts/ops/architecture-canvas.cjs");

test("classifyFile detects controller paths", () => {
  const res = classifyFile("src/controllers/userController.js", "class UserController {}\n");
  assert.equal(res.category, "controller");
  assert.equal(res.color, "3");
});

test("pruneEdges caps edges and per-node outgoing", () => {
  const edges = [];
  for (let i = 0; i < 60; i++) {
    edges.push({ from: "node_a", to: `node_${i}`, weight: 1 });
  }
  const pruned = pruneEdges(edges, { maxEdges: 50, maxOut: 5 });
  assert.ok(pruned.length <= 50);
  const outCount = pruned.filter((edge) => edge.from === "node_a").length;
  assert.ok(outCount <= 5);
});

test("aggregateNodesIfNeeded keeps node count under limit", () => {
  const nodes = Array.from({ length: 320 }, (_, i) => ({
    id: `n${i}`,
    type: "text",
    text: "",
    x: 0,
    y: 0,
    width: 280,
    height: 120,
    color: "2",
    meta: {
      relPath: `src/module_${i}.js`,
      category: "service",
      group: "service",
      side: "right",
    },
  }));
  const edges = [];
  const result = aggregateNodesIfNeeded(nodes, edges, 300);
  assert.ok(result.nodes.length <= 300);
});

test("buildCanvasModel returns canvas data", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vibescore-canvas-"));
  await fs.mkdir(path.join(dir, "src"), { recursive: true });
  await fs.writeFile(path.join(dir, "src", "index.js"), "import './util.js';\nfunction main() {}\n");
  await fs.writeFile(path.join(dir, "src", "util.js"), "export function helper() {}\n");

  const result = await buildCanvasModel({ rootDir: dir });
  assert.ok(Array.isArray(result.nodes));
  assert.ok(Array.isArray(result.edges));
  assert.ok(result.nodes.length > 0);
});

test("buildCanvasModel supports focus module filtering", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vibescore-canvas-focus-"));
  await fs.mkdir(path.join(dir, "src"), { recursive: true });
  await fs.mkdir(path.join(dir, "dashboard"), { recursive: true });
  await fs.writeFile(
    path.join(dir, "src", "index.js"),
    "import OpenAI from 'openai';\nimport './util.js';\nexport function main() {}\n"
  );
  await fs.writeFile(path.join(dir, "src", "util.js"), "export function helper() {}\n");
  await fs.writeFile(path.join(dir, "dashboard", "app.jsx"), "export const App = () => null;\n");

  const result = await buildCanvasModel({ rootDir: dir, focusModule: "src" });
  const fileNodes = result.nodes.filter((node) => node.meta && node.meta.relPath && node.type === "text");
  const relPaths = fileNodes.map((node) => node.meta.relPath);

  assert.ok(relPaths.some((p) => p.startsWith("src/")));
  assert.ok(relPaths.includes("external"));
  assert.ok(!relPaths.some((p) => p.startsWith("dashboard/")));
});
