// Edge function: vibeusage-user-status
// Returns Pro status for the authenticated user.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getAnonKey, getBaseUrl, getServiceRoleKey } = require('../shared/env');
const { computeProStatus } = require('../shared/pro-status');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibeusage-user-status', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: auth.error || 'Unauthorized' }, auth.status || 401);

  let createdAt = null;
  let partial = false;
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    partial = true;
  } else {
    const anonKey = getAnonKey();
    const serviceClient = createClient({
      baseUrl,
      anonKey: anonKey || serviceRoleKey,
      edgeFunctionToken: serviceRoleKey
    });

    const { data: userRow, error: userRowErr } = await serviceClient.database
      .from('users')
      .select('created_at')
      .eq('id', auth.userId)
      .maybeSingle();

    if (userRowErr) return json({ error: userRowErr.message }, 500);
    if (typeof userRow?.created_at !== 'string' || userRow.created_at.length === 0) {
      return json({ error: 'Missing user created_at' }, 500);
    }
    createdAt = userRow.created_at;
  }

  const { data: entitlements, error: entErr } = await auth.edgeClient.database
    .from('vibeusage_user_entitlements')
    .select('source,effective_from,effective_to,revoked_at')
    .eq('user_id', auth.userId)
    .order('effective_to', { ascending: false });

  if (entErr) return json({ error: entErr.message }, 500);

  let subscriptions = [];
  let subscriptionsPartial = false;
  const { data: subscriptionRows, error: subscriptionErr } = await auth.edgeClient.database
    .from('vibeusage_tracker_subscriptions')
    .select('tool,provider,product,plan_type,rate_limit_tier,active_start,active_until,last_checked,observed_at,updated_at')
    .eq('user_id', auth.userId)
    .order('updated_at', { ascending: false });

  if (subscriptionErr) {
    if (isMissingRelationError(subscriptionErr)) {
      subscriptionsPartial = true;
    } else {
      return json({ error: subscriptionErr.message }, 500);
    }
  } else {
    subscriptions = normalizeSubscriptions(subscriptionRows);
  }

  const asOf = new Date().toISOString();
  const status = computeProStatus({ createdAt, entitlements, now: asOf });

  return json(
    {
      user_id: auth.userId,
      created_at: createdAt ?? null,
      pro: {
        active: status.active,
        sources: status.sources,
        expires_at: status.expires_at,
        partial,
        as_of: asOf
      },
      subscriptions: {
        partial: subscriptionsPartial,
        as_of: asOf,
        items: subscriptions
      }
    },
    200
  );
});

function normalizeSubscriptions(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  for (const row of list) {
    const tool = normalizeText(row?.tool);
    const provider = normalizeText(row?.provider);
    const product = normalizeText(row?.product);
    const planType = normalizeText(row?.plan_type);
    if (!tool || !provider || !product || !planType) continue;
    out.push({
      tool,
      provider,
      product,
      plan_type: planType,
      rate_limit_tier: normalizeText(row?.rate_limit_tier),
      active_start: normalizeIso(row?.active_start),
      active_until: normalizeIso(row?.active_until),
      last_checked: normalizeIso(row?.last_checked),
      observed_at: normalizeIso(row?.observed_at),
      updated_at: normalizeIso(row?.updated_at)
    });
  }
  return out;
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeIso(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dt = new Date(trimmed);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toISOString();
}

function isMissingRelationError(err) {
  const code = typeof err?.code === 'string' ? err.code.trim() : '';
  if (code === '42P01') return true;
  const msg = String(err?.message || '').toLowerCase();
  return msg.includes('vibeusage_tracker_subscriptions') && msg.includes('does not exist');
}
