const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

const { cmdSync } = require('../src/commands/sync');

async function readJsonl(filePath) {
  const raw = await fs.readFile(filePath, 'utf8').catch(() => '');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

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

test('sync --from-openclaw falls back to previous session totals when jsonl has zero usage', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-sync-openclaw-fallback-'));
  const prevHome = process.env.HOME;
  const prevCodexHome = process.env.CODEX_HOME;
  const prevCodeHome = process.env.CODE_HOME;
  const prevGeminiHome = process.env.GEMINI_HOME;
  const prevOpencodeHome = process.env.OPENCODE_HOME;
  const prevAgentId = process.env.VIBEUSAGE_OPENCLAW_AGENT_ID;
  const prevSessionId = process.env.VIBEUSAGE_OPENCLAW_PREV_SESSION_ID;
  const prevOpenclawHome = process.env.VIBEUSAGE_OPENCLAW_HOME;
  const prevTotal = process.env.VIBEUSAGE_OPENCLAW_PREV_TOTAL_TOKENS;
  const prevInput = process.env.VIBEUSAGE_OPENCLAW_PREV_INPUT_TOKENS;
  const prevOutput = process.env.VIBEUSAGE_OPENCLAW_PREV_OUTPUT_TOKENS;
  const prevModel = process.env.VIBEUSAGE_OPENCLAW_PREV_MODEL;
  const prevUpdatedAt = process.env.VIBEUSAGE_OPENCLAW_PREV_UPDATED_AT;

  try {
    process.env.HOME = tmp;
    process.env.CODEX_HOME = path.join(tmp, '.codex');
    process.env.CODE_HOME = path.join(tmp, '.code');
    process.env.GEMINI_HOME = path.join(tmp, '.gemini');
    process.env.OPENCODE_HOME = path.join(tmp, '.opencode');

    const openclawHome = path.join(tmp, '.openclaw');
    const sessionDir = path.join(openclawHome, 'agents', 'coding', 'sessions');
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.writeFile(
      path.join(sessionDir, 'session-a.jsonl'),
      [
        JSON.stringify({ type: 'session', id: 'session-a', timestamp: '2026-02-14T00:00:00.000Z' }),
        JSON.stringify({
          type: 'message',
          timestamp: '2026-02-14T00:00:01.000Z',
          message: {
            role: 'assistant',
            model: 'delivery-mirror',
            usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 }
          }
        })
      ].join('\n') + '\n',
      'utf8'
    );

    process.env.VIBEUSAGE_OPENCLAW_AGENT_ID = 'coding';
    process.env.VIBEUSAGE_OPENCLAW_PREV_SESSION_ID = 'session-a';
    process.env.VIBEUSAGE_OPENCLAW_HOME = openclawHome;
    process.env.VIBEUSAGE_OPENCLAW_PREV_TOTAL_TOKENS = '100';
    process.env.VIBEUSAGE_OPENCLAW_PREV_INPUT_TOKENS = '70';
    process.env.VIBEUSAGE_OPENCLAW_PREV_OUTPUT_TOKENS = '30';
    process.env.VIBEUSAGE_OPENCLAW_PREV_MODEL = 'gpt-5.3-codex';
    process.env.VIBEUSAGE_OPENCLAW_PREV_UPDATED_AT = '2026-02-14T00:30:00.000Z';

    await cmdSync(['--from-openclaw']);

    const queuePath = path.join(tmp, '.vibeusage', 'tracker', 'queue.jsonl');
    const firstRunRows = await readJsonl(queuePath);
    assert.ok(firstRunRows.length > 0, 'expected at least one queued row');
    const firstLast = firstRunRows[firstRunRows.length - 1];
    assert.equal(firstLast.source, 'openclaw');
    assert.equal(firstLast.total_tokens, 100);
    assert.equal(firstLast.input_tokens, 70);
    assert.equal(firstLast.output_tokens, 30);

    await cmdSync(['--from-openclaw']);
    const secondRunRows = await readJsonl(queuePath);
    assert.equal(secondRunRows.length, firstRunRows.length, 'expected no duplicate queue rows when totals do not change');

    process.env.VIBEUSAGE_OPENCLAW_PREV_TOTAL_TOKENS = '140';
    process.env.VIBEUSAGE_OPENCLAW_PREV_INPUT_TOKENS = '98';
    process.env.VIBEUSAGE_OPENCLAW_PREV_OUTPUT_TOKENS = '42';
    process.env.VIBEUSAGE_OPENCLAW_PREV_UPDATED_AT = '2026-02-14T00:35:00.000Z';

    await cmdSync(['--from-openclaw']);
    const thirdRunRows = await readJsonl(queuePath);
    assert.equal(thirdRunRows.length, firstRunRows.length + 1, 'expected one new queued row when totals increase');
    const thirdLast = thirdRunRows[thirdRunRows.length - 1];
    assert.equal(thirdLast.source, 'openclaw');
    assert.equal(thirdLast.total_tokens, 140);
    assert.equal(thirdLast.input_tokens, 98);
    assert.equal(thirdLast.output_tokens, 42);
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
    if (prevAgentId === undefined) delete process.env.VIBEUSAGE_OPENCLAW_AGENT_ID;
    else process.env.VIBEUSAGE_OPENCLAW_AGENT_ID = prevAgentId;
    if (prevSessionId === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_SESSION_ID;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_SESSION_ID = prevSessionId;
    if (prevOpenclawHome === undefined) delete process.env.VIBEUSAGE_OPENCLAW_HOME;
    else process.env.VIBEUSAGE_OPENCLAW_HOME = prevOpenclawHome;
    if (prevTotal === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_TOTAL_TOKENS;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_TOTAL_TOKENS = prevTotal;
    if (prevInput === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_INPUT_TOKENS;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_INPUT_TOKENS = prevInput;
    if (prevOutput === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_OUTPUT_TOKENS;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_OUTPUT_TOKENS = prevOutput;
    if (prevModel === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_MODEL;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_MODEL = prevModel;
    if (prevUpdatedAt === undefined) delete process.env.VIBEUSAGE_OPENCLAW_PREV_UPDATED_AT;
    else process.env.VIBEUSAGE_OPENCLAW_PREV_UPDATED_AT = prevUpdatedAt;
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
