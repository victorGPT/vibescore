import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COPY_REQUIRED_KEYS = [
  'landing.meta.title',
  'landing.meta.description',
  'landing.meta.og_site_name',
  'landing.meta.og_type',
  'landing.meta.og_image',
  'landing.meta.og_url',
  'landing.meta.twitter_card',
  'share.meta.title',
  'share.meta.description',
  'share.meta.og_site_name',
  'share.meta.og_type',
  'share.meta.og_image',
  'share.meta.og_url',
  'share.meta.twitter_card'
];

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const COPY_PATH = path.join(ROOT_DIR, 'src', 'content', 'copy.csv');

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = raw[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      if (!row.every((cell) => cell.trim() === '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (ch === '\r') {
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (!row.every((cell) => cell.trim() === '')) {
    rows.push(row);
  }

  return rows;
}

function loadCopyRegistry() {
  let raw = '';
  try {
    raw = fs.readFileSync(COPY_PATH, 'utf8');
  } catch (error) {
    console.warn('[vibeusage] Failed to read copy registry:', error.message);
    return new Map();
  }

  const rows = parseCsv(raw);
  if (!rows.length) return new Map();

  const header = rows[0].map((cell) => cell.trim());
  const keyIndex = header.indexOf('key');
  const textIndex = header.indexOf('text');
  if (keyIndex === -1 || textIndex === -1) {
    console.warn('[vibeusage] Copy registry missing key/text columns.');
    return new Map();
  }

  const map = new Map();
  rows.slice(1).forEach((cells) => {
    const key = String(cells[keyIndex] || '').trim();
    if (!key) return;
    const text = String(cells[textIndex] ?? '').trim();
    map.set(key, text);
  });

  return map;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMeta(prefix = 'landing') {
  const map = loadCopyRegistry();
  const read = (key) => map.get(`${prefix}.meta.${key}`) || '';

  const missing = COPY_REQUIRED_KEYS.filter((key) => !map.has(key));
  if (missing.length) {
    console.warn('[vibeusage] Copy registry missing keys:', missing.join(', '));
  }

  return {
    title: read('title'),
    description: read('description'),
    ogSiteName: read('og_site_name'),
    ogType: read('og_type'),
    ogImage: read('og_image'),
    ogUrl: read('og_url'),
    twitterCard: read('twitter_card')
  };
}

function resolveMetaPrefix(ctx) {
  const rawPath = String(
    ctx?.path || ctx?.filename || ctx?.originalUrl || ''
  ).toLowerCase();
  if (rawPath.includes('share')) return 'share';
  if (rawPath.includes('wrapped-2025')) return 'share';
  return 'landing';
}

function injectRichMeta(html, prefix) {
  const meta = buildMeta(prefix);
  const replacements = {
    '__VIBEUSAGE_TITLE__': meta.title,
    '__VIBEUSAGE_DESCRIPTION__': meta.description,
    '__VIBEUSAGE_OG_SITE_NAME__': meta.ogSiteName,
    '__VIBEUSAGE_OG_TITLE__': meta.title,
    '__VIBEUSAGE_OG_DESCRIPTION__': meta.description,
    '__VIBEUSAGE_OG_IMAGE__': meta.ogImage,
    '__VIBEUSAGE_OG_TYPE__': meta.ogType,
    '__VIBEUSAGE_OG_URL__': meta.ogUrl,
    '__VIBEUSAGE_TWITTER_CARD__': meta.twitterCard,
    '__VIBEUSAGE_TWITTER_TITLE__': meta.title,
    '__VIBEUSAGE_TWITTER_DESCRIPTION__': meta.description,
    '__VIBEUSAGE_TWITTER_IMAGE__': meta.ogImage
  };

  let output = html;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.replaceAll(token, escapeHtml(value));
  }
  return output;
}

function richLinkMetaPlugin() {
  return {
    name: 'vibeusage-rich-link-meta',
    transformIndexHtml(html, ctx) {
      return injectRichMeta(html, resolveMetaPrefix(ctx));
    }
  };
}

export default defineConfig({
  plugins: [react(), richLinkMetaPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(ROOT_DIR, 'index.html'),
        share: path.resolve(ROOT_DIR, 'share.html'),
        wrapped: path.resolve(ROOT_DIR, 'wrapped-2025.html')
      }
    }
  },
  server: {
    port: 5173,
    // Prefer 5173 for local CLI integration, but don't fail if already in use.
    strictPort: false
  }
});
