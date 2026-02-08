const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { test } = require('node:test');

const { collectLocalSubscriptions } = require('../src/lib/subscriptions');

function base64UrlEncodeJson(value) {
  const raw = Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
  return raw.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJwt(payload) {
  const header = base64UrlEncodeJson({ alg: 'none', typ: 'JWT' });
  const body = base64UrlEncodeJson(payload);
  return `${header}.${body}.`;
}

async function writeJson(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

test('collectLocalSubscriptions returns paid ChatGPT plans from codex + opencode', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-subscriptions-'));

  try {
    const home = tmp;
    const codexHome = path.join(tmp, '.codex');
    const codexJwt = makeJwt({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'pro' }
    });
    await writeJson(path.join(codexHome, 'auth.json'), {
      tokens: { access_token: codexJwt }
    });

    const opencodeJwt = makeJwt({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'plus' }
    });
    await writeJson(path.join(tmp, '.local', 'share', 'opencode', 'auth.json'), {
      openai: { access: opencodeJwt }
    });

    const subs = await collectLocalSubscriptions({
      home,
      env: { CODEX_HOME: codexHome },
      platform: 'linux'
    });

    assert.equal(subs.length, 2);
    assert.ok(subs.some((s) => s.tool === 'codex' && s.planType === 'pro'));
    assert.ok(subs.some((s) => s.tool === 'opencode' && s.planType === 'plus'));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('collectLocalSubscriptions hides free/unknown plans', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-subscriptions-free-'));

  try {
    const home = tmp;
    const codexHome = path.join(tmp, '.codex');
    const codexJwt = makeJwt({
      'https://api.openai.com/auth': { chatgpt_plan_type: 'free' }
    });
    await writeJson(path.join(codexHome, 'auth.json'), {
      tokens: { access_token: codexJwt }
    });

    const subs = await collectLocalSubscriptions({
      home,
      env: { CODEX_HOME: codexHome },
      platform: 'linux'
    });

    assert.deepEqual(subs, []);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('collectLocalSubscriptions can probe Claude Code keychain item existence (no secret read)', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-subscriptions-claude-'));

  try {
    const runner = (cmd, args) => {
      const service = args?.[args.indexOf('-s') + 1] || '';
      return {
        status: cmd === '/usr/bin/security' && service === 'Claude Code-credentials' ? 0 : 1
      };
    };

    const subs = await collectLocalSubscriptions({
      home: tmp,
      env: {},
      platform: 'darwin',
      securityRunner: runner,
      probeKeychain: true
    });

    assert.equal(subs.length, 1);
    assert.deepEqual(subs[0], {
      tool: 'claude',
      provider: 'anthropic',
      product: 'credentials',
      planType: 'present'
    });
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('collectLocalSubscriptions does not probe Claude keychain by default', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-subscriptions-claude-default-'));

  try {
    let calls = 0;
    const runner = () => {
      calls += 1;
      return { status: 0 };
    };

    const subs = await collectLocalSubscriptions({
      home: tmp,
      env: {},
      platform: 'darwin',
      securityRunner: runner
    });

    assert.deepEqual(subs, []);
    assert.equal(calls, 0);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('collectLocalSubscriptions hides Claude keychain line when probe fails', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-subscriptions-claude-miss-'));

  try {
    const runner = () => ({ status: 1 });

    const subs = await collectLocalSubscriptions({
      home: tmp,
      env: {},
      platform: 'darwin',
      securityRunner: runner,
      probeKeychain: true
    });

    assert.deepEqual(subs, []);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
