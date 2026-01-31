const path = require('node:path');

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const NOISE_SEGMENTS = ['__tests__', 'test', 'tests', 'fixtures', 'dist', 'build', 'generated'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.tmp', 'dist', 'build']);

function scanDomainMetrics({ rootDir, domains, fs, path: pathMod = path }) {
  return domains.map(domain => {
    const { fileCount, noiseCount } = countFiles({
      baseDir: rootDir,
      relPaths: domain.paths,
      fs,
      path: pathMod
    });
    const noiseRatio = fileCount === 0 ? 0 : noiseCount / fileCount;
    return {
      name: domain.name,
      fileCount,
      noiseCount,
      noiseRatio
    };
  });
}

function countFiles({ baseDir, relPaths, fs, path: pathMod }) {
  let fileCount = 0;
  let noiseCount = 0;

  for (const relPath of relPaths) {
    walk(pathMod.join(baseDir, relPath));
  }

  return { fileCount, noiseCount };

  function walk(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = pathMod.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = pathMod.extname(full);
      if (!CODE_EXTS.has(ext)) continue;
      fileCount += 1;
      if (NOISE_SEGMENTS.some(seg => full.split(pathMod.sep).includes(seg))) {
        noiseCount += 1;
      }
    }
  }
}

module.exports = { scanDomainMetrics };
