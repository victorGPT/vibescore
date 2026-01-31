const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const BASE_URL = 'http://insforge:7130';
const JWT_SECRET = 'jwt_secret_test';
const ANON_KEY = 'anon_test_123';

function setDenoEnv(env) {
  const merged = { INSFORGE_JWT_SECRET: JWT_SECRET, INSFORGE_ANON_KEY: ANON_KEY, ...env };
  globalThis.Deno = {
    env: {
      get(key) {
        return Object.prototype.hasOwnProperty.call(merged, key) ? merged[key] : undefined;
      }
    }
  };
}

test('getAccessContext skips public view lookup for invalid share token', async () => {
  const publicViewPath = require.resolve('../insforge-src/shared/public-view');
  const authPath = require.resolve('../insforge-src/shared/auth');

  let publicCalls = 0;
  require.cache[publicViewPath] = {
    exports: {
      resolvePublicView: async () => {
        publicCalls += 1;
        return { ok: true, edgeClient: {}, userId: 'user' };
      },
      isPublicShareToken: () => false
    }
  };
  delete require.cache[authPath];

  globalThis.createClient = () => ({
    auth: {
      getCurrentUser: async () => ({ data: { user: null }, error: { message: 'User missing' } })
    }
  });
  setDenoEnv();

  const { getAccessContext } = require('../insforge-src/shared/auth');
  const res = await getAccessContext({ baseUrl: BASE_URL, bearer: 'not-a-token', allowPublic: true });

  assert.equal(res.ok, false);
  assert.equal(publicCalls, 0);
});
