const fs = require('node:fs/promises');
const fssync = require('node:fs');
const readline = require('node:readline');

const { ensureDir, readJson, writeJson } = require('./fs');
const { ingestHourly } = require('./vibeusage-api');

const DEFAULT_SOURCE = 'codex';
const DEFAULT_MODEL = 'unknown';
const BUCKET_SEPARATOR = '|';

async function drainQueueToCloud({
  baseUrl,
  deviceToken,
  queuePath,
  queueStatePath,
  projectQueuePath,
  projectQueueStatePath,
  maxBatches,
  batchSize,
  onProgress
}) {
  await ensureDir(require('node:path').dirname(queueStatePath));
  const projectQueueEnabled = typeof projectQueuePath === 'string' && projectQueuePath.length > 0;
  if (projectQueueEnabled && (!projectQueueStatePath || projectQueueStatePath.length === 0)) {
    throw new Error('projectQueueStatePath is required when projectQueuePath is set');
  }
  if (projectQueueEnabled) {
    await ensureDir(require('node:path').dirname(projectQueueStatePath));
  }

  const state = (await readJson(queueStatePath)) || { offset: 0 };
  let offset = Number(state.offset || 0);
  const projectStatePath = projectQueueEnabled ? projectQueueStatePath : null;
  const projectState = projectQueueEnabled ? (await readJson(projectStatePath)) || { offset: 0 } : { offset: 0 };
  let projectOffset = Number(projectState.offset || 0);
  let inserted = 0;
  let skipped = 0;
  let attempted = 0;

  const cb = typeof onProgress === 'function' ? onProgress : null;
  const queueSize = await safeFileSize(queuePath);
  const projectQueueSize = await safeFileSize(projectQueuePath);
  const maxBuckets = Math.max(1, Math.floor(Number(batchSize || 200)));

  for (let batch = 0; batch < maxBatches; batch++) {
    const res = await readBatch(queuePath, offset, maxBuckets);
    const projectRes = await readProjectBatch(projectQueuePath, projectOffset, maxBuckets);
    if (res.buckets.length === 0 && projectRes.buckets.length === 0) break;

    attempted += res.buckets.length + projectRes.buckets.length;
    const ingest = await ingestHourly({
      baseUrl,
      deviceToken,
      hourly: res.buckets,
      project_hourly: projectRes.buckets
    });
    inserted += ingest.inserted || 0;
    skipped += ingest.skipped || 0;

    offset = res.nextOffset;
    state.offset = offset;
    state.updatedAt = new Date().toISOString();
    await writeJson(queueStatePath, state);
    if (projectQueuePath) {
      projectOffset = projectRes.nextOffset;
      projectState.offset = projectOffset;
      projectState.updatedAt = new Date().toISOString();
      await writeJson(projectStatePath, projectState);
    }

    if (cb) {
      const combinedOffset = offset + projectOffset;
      cb({
        batch: batch + 1,
        maxBatches,
        offset: combinedOffset,
        queueSize: queueSize + projectQueueSize,
        inserted,
        skipped
      });
    }
  }

  return { inserted, skipped, attempted };
}

async function readBatch(queuePath, startOffset, maxBuckets) {
  const st = await fs.stat(queuePath).catch(() => null);
  if (!st || !st.isFile()) return { buckets: [], nextOffset: startOffset };
  if (startOffset >= st.size) return { buckets: [], nextOffset: startOffset };

  const stream = fssync.createReadStream(queuePath, { encoding: 'utf8', start: startOffset });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const bucketMap = new Map();
  let offset = startOffset;
  let linesRead = 0;
  for await (const line of rl) {
    const bytes = Buffer.byteLength(line, 'utf8') + 1;
    offset += bytes;
    if (!line.trim()) continue;
    let bucket;
    try {
      bucket = JSON.parse(line);
    } catch (_e) {
      continue;
    }
    const hourStart = typeof bucket?.hour_start === 'string' ? bucket.hour_start : null;
    if (!hourStart) continue;
    const source = normalizeSource(bucket?.source) || DEFAULT_SOURCE;
    const model = normalizeModel(bucket?.model) || DEFAULT_MODEL;
    bucket.source = source;
    bucket.model = model;
    bucketMap.set(bucketKey(source, model, hourStart), bucket);
    linesRead += 1;
    if (linesRead >= maxBuckets) break;
  }

  rl.close();
  stream.close?.();
  return { buckets: Array.from(bucketMap.values()), nextOffset: offset };
}

async function readProjectBatch(queuePath, startOffset, maxBuckets) {
  if (!queuePath) return { buckets: [], nextOffset: startOffset };
  const st = await fs.stat(queuePath).catch(() => null);
  if (!st || !st.isFile()) return { buckets: [], nextOffset: startOffset };
  if (startOffset >= st.size) return { buckets: [], nextOffset: startOffset };

  const stream = fssync.createReadStream(queuePath, { encoding: 'utf8', start: startOffset });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const bucketMap = new Map();
  let offset = startOffset;
  let linesRead = 0;
  for await (const line of rl) {
    const bytes = Buffer.byteLength(line, 'utf8') + 1;
    offset += bytes;
    if (!line.trim()) continue;
    let bucket;
    try {
      bucket = JSON.parse(line);
    } catch (_e) {
      continue;
    }
    const hourStart = typeof bucket?.hour_start === 'string' ? bucket.hour_start : null;
    const projectKey = typeof bucket?.project_key === 'string' ? bucket.project_key : null;
    const projectRef = typeof bucket?.project_ref === 'string' ? bucket.project_ref : null;
    if (!hourStart || !projectKey || !projectRef) continue;
    const source = normalizeSource(bucket?.source) || DEFAULT_SOURCE;
    bucket.source = source;
    bucket.project_key = projectKey;
    bucket.project_ref = projectRef;
    bucketMap.set(projectBucketKey(projectKey, source, hourStart), bucket);
    linesRead += 1;
    if (linesRead >= maxBuckets) break;
  }

  rl.close();
  stream.close?.();
  return { buckets: Array.from(bucketMap.values()), nextOffset: offset };
}

async function safeFileSize(p) {
  try {
    const st = await fs.stat(p);
    return st && st.isFile() ? st.size : 0;
  } catch (_e) {
    return 0;
  }
}

function bucketKey(source, model, hourStart) {
  return `${source}${BUCKET_SEPARATOR}${model}${BUCKET_SEPARATOR}${hourStart}`;
}

function projectBucketKey(projectKey, source, hourStart) {
  return `${projectKey}${BUCKET_SEPARATOR}${source}${BUCKET_SEPARATOR}${hourStart}`;
}

function normalizeSource(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeModel(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

module.exports = { drainQueueToCloud };
