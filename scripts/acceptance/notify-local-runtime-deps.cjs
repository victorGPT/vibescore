const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawnSync } = require('node:child_process');

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vibescore-accept-'));
  const env = {
    ...process.env,
    HOME: tmpRoot,
    CODEX_HOME: path.join(tmpRoot, '.codex')
  };

  await fs.mkdir(env.CODEX_HOME, { recursive: true });
  await fs.writeFile(path.join(env.CODEX_HOME, 'config.toml'), '# test config\n', 'utf8');

  const init = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'bin', 'tracker.js'), 'init', '--no-auth', '--no-open'],
    { env, stdio: 'inherit' }
  );
  if (init.status !== 0) {
    process.exit(init.status || 1);
  }

  const depPath = path.join(
    tmpRoot,
    '.vibescore',
    'tracker',
    'app',
    'node_modules',
    '@insforge',
    'sdk',
    'package.json'
  );

  try {
    await fs.access(depPath);
  } catch (_e) {
    console.error(`Missing runtime dependency: ${depPath}`);
    process.exit(1);
  }

  console.log('ok: local runtime dependencies installed');
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
