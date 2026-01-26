const { execFileSync } = require("node:child_process");
const path = require("node:path");

function main() {
  const bin = path.join(
    __dirname,
    "..",
    "..",
    "node_modules",
    ".bin",
    "scip-typescript"
  );

  execFileSync(bin, ["index", "--output", "index.scip"], {
    stdio: "inherit"
  });
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
