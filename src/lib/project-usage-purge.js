const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');

async function purgeProjectUsage({ projectKey, projectQueuePath, projectQueueStatePath, projectState }) {
  if (!projectKey || !projectQueuePath || !projectQueueStatePath || !projectState) {
    return { removed: 0, kept: 0, removedBuckets: 0 };
  }

  let previousOffset = 0;
  const previousState = await fsp.readFile(projectQueueStatePath, 'utf8').catch(() => null);
  if (previousState) {
    try {
      const parsed = JSON.parse(previousState);
      const offset = Number(parsed?.offset || 0);
      if (Number.isFinite(offset) && offset >= 0) previousOffset = offset;
    } catch (_err) {
      previousOffset = 0;
    }
  }

  const buckets = projectState.buckets && typeof projectState.buckets === 'object' ? projectState.buckets : {};
  let removedBuckets = 0;
  const prefix = `${projectKey}|`;
  for (const key of Object.keys(buckets)) {
    if (key.startsWith(prefix)) {
      delete buckets[key];
      removedBuckets += 1;
    }
  }
  projectState.buckets = buckets;

  let removed = 0;
  let kept = 0;
  let nextOffset = 0;
  const st = await fsp.stat(projectQueuePath).catch(() => null);
  if (st && st.isFile()) {
    const tmpPath = `${projectQueuePath}.tmp`;
    await fsp.mkdir(path.dirname(projectQueuePath), { recursive: true });
    const input = fs.createReadStream(projectQueuePath, 'utf8');
    const output = fs.createWriteStream(tmpPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input, crlfDelay: Infinity });

    let inputOffset = 0;
    let outputOffset = 0;
    for await (const line of rl) {
      const trimmed = line.trim();
      const inputBytes = Buffer.byteLength(line, 'utf8') + 1;
      inputOffset += inputBytes;
      if (!trimmed) continue;
      let parsed = null;
      try {
        parsed = JSON.parse(trimmed);
      } catch (_err) {
        const entry = trimmed + '\n';
        output.write(entry);
        outputOffset += Buffer.byteLength(entry, 'utf8');
        kept += 1;
        if (inputOffset <= previousOffset) {
          nextOffset = outputOffset;
        }
        continue;
      }
      if (parsed && parsed.project_key === projectKey) {
        removed += 1;
        if (inputOffset <= previousOffset) {
          nextOffset = outputOffset;
        }
        continue;
      }
      const entry = JSON.stringify(parsed) + '\n';
      output.write(entry);
      outputOffset += Buffer.byteLength(entry, 'utf8');
      kept += 1;
      if (inputOffset <= previousOffset) {
        nextOffset = outputOffset;
      }
    }

    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on('error', reject);
    });

    await fsp.rename(tmpPath, projectQueuePath);
    if (previousOffset >= inputOffset) {
      nextOffset = outputOffset;
    }
  } else {
    await fsp.writeFile(projectQueuePath, '', 'utf8');
    nextOffset = 0;
  }

  await fsp.writeFile(projectQueueStatePath, JSON.stringify({ offset: nextOffset }), 'utf8');

  return { removed, kept, removedBuckets };
}

module.exports = { purgeProjectUsage };
