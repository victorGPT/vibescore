const path = require('node:path');

function loadGraphConfig({ rootDir, fs, path: pathMod = path }) {
  const entries = fs.readdirSync(rootDir);
  const tsconfigPaths = entries
    .filter(name => name.startsWith('tsconfig') && name.endsWith('.json'))
    .map(name => pathMod.join(rootDir, name))
    .filter(filePath => {
      try {
        return fs.statSync(filePath).isFile();
      } catch (err) {
        return false;
      }
    });

  return {
    rootDir,
    tsconfigPaths,
    thresholds: {
      splitMinFiles: 200,
      maxNoiseRatio: 0.15,
      minDomainsToSplit: 2
    }
  };
}

module.exports = { loadGraphConfig };
