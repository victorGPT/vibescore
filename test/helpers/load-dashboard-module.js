const path = require("node:path");
const { build } = require("esbuild");

const repoRoot = path.join(__dirname, "..", "..");

async function loadDashboardModule(relativePath) {
  const entryPoint = path.join(repoRoot, relativePath);
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    sourcemap: "inline",
    write: false,
  });

  const source = result.outputFiles[0]?.text ?? "";
  const base64 = Buffer.from(source, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${base64}`);
}

module.exports = { loadDashboardModule };
