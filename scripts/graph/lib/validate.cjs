function validateScipCoverage({ scipOutputs, thresholds, deps }) {
  const maxNoiseRatio = thresholds.maxNoiseRatio;
  const failures = [];

  for (const entry of scipOutputs) {
    const index = deps.parseScipFile(entry.scipPath);
    const docs = index.documents || [];
    const rawPrefix = entry.domain.paths[0] || '';
    const domainPrefix = rawPrefix.replace(/\\/g, '/');
    const domainDocs = domainPrefix === '.' || domainPrefix === ''
      ? docs.filter(doc => (doc.relativePath || doc.relative_path || '').length > 0)
      : docs.filter(doc => (doc.relativePath || doc.relative_path || '').startsWith(`${domainPrefix}/`));
    const noiseDocs = domainDocs.filter(doc => isNoisePath(doc.relativePath || doc.relative_path || ''));
    const noiseRatio = domainDocs.length === 0 ? 0 : noiseDocs.length / domainDocs.length;

    if (domainDocs.length === 0) {
      failures.push({ domain: entry.domain.name, reason: 'no_docs' });
    }
    if (noiseRatio > maxNoiseRatio) {
      failures.push({ domain: entry.domain.name, reason: 'noise_ratio' });
    }
  }

  return { ok: failures.length === 0, failures };
}

function isNoisePath(relPath) {
  const parts = relPath.split('/');
  return parts.includes('__tests__') ||
    parts.includes('tests') ||
    parts.includes('test') ||
    parts.includes('fixtures') ||
    parts.includes('dist') ||
    parts.includes('build');
}

module.exports = { validateScipCoverage };
