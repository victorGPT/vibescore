const path = require('node:path');

function runScipForPlan({ rootDir, plan, deps }) {
  const {
    fs,
    execFileSync,
    scipBin = defaultScipBin(rootDir, path),
    path: pathMod = path
  } = deps;

  const baseTsconfig = resolveBaseTsconfig(rootDir, fs, pathMod);
  const tmpDir = pathMod.join(rootDir, '.tmp', 'graph', 'auto-index');
  fs.mkdirSync(tmpDir, { recursive: true });

  return plan.domains.map(domain => {
    const tsconfigPath = pathMod.join(tmpDir, `tsconfig.${domain.name}.json`);
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify(buildDomainTsconfig(rootDir, domain, pathMod, baseTsconfig), null, 2)
    );

    const scipPath = pathMod.join(rootDir, `index.${domain.name}.scip`);
    const args = ['index', '--cwd', rootDir, '--output', scipPath, tsconfigPath];
    execFileSync(scipBin, args, { stdio: 'inherit' });

    return { domain, scipPath, tsconfigPath };
  });
}

function buildDomainTsconfig(rootDir, domain, pathMod, baseTsconfig) {
  const tempBase = pathMod.join(rootDir, '.tmp', 'graph', 'auto-index');
  const relBase = pathMod.relative(tempBase, baseTsconfig);
  const extendsPath = relBase.startsWith('.') ? relBase : `./${relBase}`;
  const include = domain.paths.map(p => {
    const relPath = pathMod.relative(tempBase, pathMod.join(rootDir, p));
    return pathMod.join(relPath, '**/*');
  });

  return {
    extends: extendsPath,
    include,
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
  };
}

function defaultScipBin(rootDir, pathMod) {
  return pathMod.join(rootDir, 'node_modules', '.bin', 'scip-typescript');
}

function resolveBaseTsconfig(rootDir, fs, pathMod) {
  const basePath = pathMod.join(rootDir, 'tsconfig.json');
  const scipPath = pathMod.join(rootDir, 'tsconfig.scip.json');
  if (fs.existsSync(basePath)) {
    return basePath;
  }
  if (fs.existsSync(scipPath)) {
    return scipPath;
  }
  throw new Error('Missing tsconfig.json or tsconfig.scip.json for graph indexing.');
}

module.exports = { runScipForPlan };
