function decideSplit({ metrics, thresholds }) {
  const { splitMinFiles, maxNoiseRatio, minDomainsToSplit } = thresholds;
  const eligible = metrics.filter(metric => metric.fileCount >= splitMinFiles && metric.noiseRatio <= maxNoiseRatio);
  const decision = eligible.length >= minDomainsToSplit ? 'split' : 'single';
  return { decision, eligible };
}

module.exports = { decideSplit };
