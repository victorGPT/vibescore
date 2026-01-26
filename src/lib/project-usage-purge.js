const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');

async function purgeProjectUsage({ projectKey, projectQueuePath, projectQueueStatePath, projectState }) {
  if (!projectKey || !projectQueuePath || !projectQueueStatePath || !projectState) {
    return { removed: 0, kept: 0, removedBuckets: 0 };
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
  const st = await fsp.stat(projectQueuePath).catch(() => null);
  if (st && st.isFile()) {
    const tmpPath = `${projectQueuePath}.tmp`;
    await fsp.mkdir(path.dirname(projectQueuePath), { recursive: true });
    const input = fs.createReadStream(projectQueuePath, 'utf8');
    const output = fs.createWriteStream(tmpPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input, crlfDelay: Infinity });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed = null;
      try {
        parsed = JSON.parse(trimmed);
      } catch (_err) {
        output.write(trimmed + '\n');
        kept += 1;
        continue;
      }
      if (parsed && parsed.project_key === projectKey) {
        removed += 1;
        continue;
      }
      output.write(JSON.stringify(parsed) + '\n');
      kept += 1;
    }

    await new Promise((resolve, reject) => {
      output.end(resolve);
      output.on('error', reject);
    });

    await fsp.rename(tmpPath, projectQueuePath);
  } else {
    await fsp.writeFile(projectQueuePath, '', 'utf8');
  }

  await fsp.writeFile(projectQueueStatePath, JSON.stringify({ offset: 0 }), 'utf8');

  return { removed, kept, removedBuckets };
}

module.exports = { purgeProjectUsage };
