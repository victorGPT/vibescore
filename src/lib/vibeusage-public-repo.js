const crypto = require('node:crypto');

const GITHUB_HOST = 'github.com';
const GITHUB_API_BASE = 'https://api.github.com';

function parseGitHubRepoId(projectRef) {
  if (typeof projectRef !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(projectRef);
  } catch (_err) {
    return null;
  }
  if (!parsed.hostname || parsed.hostname.toLowerCase() !== GITHUB_HOST) return null;
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const owner = segments[0].trim().toLowerCase();
  const repo = segments[1].trim().replace(/\.git$/i, '').toLowerCase();
  if (!owner || !repo) return null;
  return { owner, repo, repoId: `${owner}/${repo}` };
}

function hashRepoRoot(repoRoot) {
  return crypto.createHash('sha256').update(String(repoRoot)).digest('hex');
}

function isRateLimited(res, body) {
  if (!res) return false;
  const remaining = res.headers?.get?.('x-ratelimit-remaining');
  if (remaining === '0') return true;
  if (res.status === 429) return true;
  if (body && typeof body.message === 'string' && body.message.toLowerCase().includes('rate limit')) {
    return true;
  }
  return false;
}

async function resolveGitHubPublicStatus(projectRef, fetchImpl) {
  const parsed = parseGitHubRepoId(projectRef);
  if (!parsed) {
    return { status: 'blocked', projectKey: null, projectRef, reason: 'non_github' };
  }
  const fetchFn = fetchImpl || fetch;
  const apiUrl = `${GITHUB_API_BASE}/repos/${parsed.repoId}`;

  let res;
  let body = null;
  try {
    res = await fetchFn(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'vibeusage-cli'
      }
    });
  } catch (_err) {
    return { status: 'pending_public', projectKey: parsed.repoId, projectRef, reason: 'fetch_failed' };
  }

  if (res.status === 200) {
    body = await res.json().catch(() => ({}));
    const isPrivate = body && typeof body.private === 'boolean' ? body.private : null;
    const visibility = typeof body?.visibility === 'string' ? body.visibility : null;
    const isPublic = isPrivate === false || visibility === 'public';
    return {
      status: isPublic ? 'public_verified' : 'blocked',
      projectKey: parsed.repoId,
      projectRef,
      reason: isPublic ? 'public' : 'private'
    };
  }

  if (res.status === 404) {
    return { status: 'blocked', projectKey: parsed.repoId, projectRef, reason: 'not_found' };
  }

  body = await res.json().catch(() => ({}));
  if (isRateLimited(res, body) || res.status === 401 || res.status === 403 || res.status >= 500) {
    return { status: 'pending_public', projectKey: parsed.repoId, projectRef, reason: 'rate_limited' };
  }

  return { status: 'pending_public', projectKey: parsed.repoId, projectRef, reason: 'unknown' };
}

module.exports = {
  parseGitHubRepoId,
  hashRepoRoot,
  resolveGitHubPublicStatus
};
