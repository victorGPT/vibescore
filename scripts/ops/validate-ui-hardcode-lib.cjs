const COLOR_REGEX =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0?\.\d+|1(?:\.0+)?))?\s*\)/g;
const JSX_TEXT_REGEX = />[^<>{}]*[\p{L}\p{N}][^<>{}]*</gu;

function normalizeJsxText(match) {
  return match.replace(/^>/, "").replace(/<$/, "").replace(/\s+/g, " ").trim();
}

function extractJsxTextTokens(content) {
  const matches = content.match(JSX_TEXT_REGEX) || [];
  return matches.map(normalizeJsxText).filter(Boolean);
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens)).sort();
}

function scanContent({ content, isJsx }) {
  const colors = content.match(COLOR_REGEX) || [];
  const rawTextTokens = isJsx ? extractJsxTextTokens(content) : [];
  return {
    colors: colors.length,
    rawText: rawTextTokens.length,
    rawTextTokens: uniqueTokens(rawTextTokens)
  };
}

function diffAgainstBaseline(current, baseline) {
  const errors = [];

  for (const [file, counts] of Object.entries(current.files)) {
    const base = baseline.files?.[file];
    if (!base) {
      errors.push(
        `${file}: new hardcode usage detected (colors=${counts.colors}, rawText=${counts.rawText})`
      );
      continue;
    }
    if (counts.colors > base.colors) {
      errors.push(`${file}: colors increased (${base.colors} -> ${counts.colors})`);
    }
    if (counts.rawText > base.rawText) {
      errors.push(`${file}: rawText increased (${base.rawText} -> ${counts.rawText})`);
    }

    const currentTokens = counts.rawTextTokens || [];
    const baseTokens = base.rawTextTokens;
    if (!baseTokens) {
      errors.push(`${file}: baseline missing rawText tokens; regenerate baseline`);
      continue;
    }
    const baseSet = new Set(baseTokens);
    const newTokens = currentTokens.filter((token) => !baseSet.has(token));
    if (newTokens.length) {
      errors.push(`${file}: rawText tokens introduced (${newTokens.length})`);
    }
  }

  return errors;
}

module.exports = {
  COLOR_REGEX,
  JSX_TEXT_REGEX,
  diffAgainstBaseline,
  extractJsxTextTokens,
  normalizeJsxText,
  scanContent
};
