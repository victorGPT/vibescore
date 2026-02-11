const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

const { cmdSync } = require('../src/commands/sync');

test('sync --from-openclaw records last OpenClaw trigger marker', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-sync-openclaw-'));
  const prevHome = process.env.HOME;
  const prevCodexHome = process.env.CODEX_HOME;
  const prevCodeHome = process.env.CODE_HOME;
  const prevGeminiHome = process.env.GEMINI_HOME;
  const prevOpencodeHome = process.env.OPENCODE_HOME;

  try {
    process.env.HOME = tmp;
    process.env.CODEX_HOME = path.join(tmp, '.codex');
    process.env.CODE_HOME = path.join(tmp, '.code');
    process.env.GEMINI_HOME = path.join(tmp, '.gemini');
    process.env.OPENCODE_HOME = path.join(tmp, '.opencode');

    await cmdSync(['--from-openclaw']);

    const markerPath = path.join(tmp, '.vibeusage', 'tracker', 'openclaw.signal');
    const marker = (await fs.readFile(markerPath, 'utf8')).trim();
    assert.ok(marker.length > 0, 'expected openclaw marker to be written');
    assert.ok(!Number.isNaN(Date.parse(marker)), 'expected openclaw marker to be ISO timestamp');
  } finally {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
    if (prevCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = prevCodexHome;
    if (prevCodeHome === undefined) delete process.env.CODE_HOME;
    else process.env.CODE_HOME = prevCodeHome;
    if (prevGeminiHome === undefined) delete process.env.GEMINI_HOME;
    else process.env.GEMINI_HOME = prevGeminiHome;
    if (prevOpencodeHome === undefined) delete process.env.OPENCODE_HOME;
    else process.env.OPENCODE_HOME = prevOpencodeHome;
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
