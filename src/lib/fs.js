const fs = require('node:fs/promises');
const path = require('node:path');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmp = `${filePath}.tmp.${Date.now()}`;
  await fs.writeFile(tmp, content, { encoding: 'utf8' });
  await fs.rename(tmp, filePath);
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

async function readJsonStrict(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return { status: 'ok', value: JSON.parse(raw), error: null };
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
      return { status: 'missing', value: null, error: err };
    }
    if (err && err.name === 'SyntaxError') {
      return { status: 'invalid', value: null, error: err };
    }
    return { status: 'error', value: null, error: err };
  }
}

async function writeJson(filePath, obj) {
  await writeFileAtomic(filePath, JSON.stringify(obj, null, 2) + '\n');
}

async function chmod600IfPossible(filePath) {
  try {
    await fs.chmod(filePath, 0o600);
  } catch (_e) {}
}

async function openLock(lockPath, { quietIfLocked }) {
  try {
    const handle = await fs.open(lockPath, 'wx');
    return {
      async release() {
        await handle.close().catch(() => {});
      }
    };
  } catch (e) {
    if (e && e.code === 'EEXIST') {
      if (!quietIfLocked) {
        process.stdout.write('Another sync is already running.\n');
      }
      return null;
    }
    throw e;
  }
}

module.exports = {
  ensureDir,
  writeFileAtomic,
  readJson,
  readJsonStrict,
  writeJson,
  chmod600IfPossible,
  openLock
};
