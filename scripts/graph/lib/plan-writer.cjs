const path = require('node:path');

function writePlan({ rootDir, plan, fs, path: pathMod = path }) {
  const outPath = pathMod.join(rootDir, 'graph.plan.json');
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2));
  return outPath;
}

module.exports = { writePlan };
