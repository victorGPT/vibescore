const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { importScip } = require('../scripts/graph/lib/importer.cjs');

test('importScip writes sqlite with documents, symbols, and occurrences', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-import-'));
  const dbPath = path.join(tmpDir, 'graph.sqlite');
  const deps = {
    fs,
    path,
    execFileSync,
    parseScipFile: () => ({
      documents: [
        {
          relative_path: 'src/a.ts',
          occurrences: [
            {
              symbol: 'test foo',
              symbol_roles: 1,
              range: [0, 0, 0]
            },
            {
              symbol: 'test foo',
              symbol_roles: 8,
              range: [1, 2, 1, 4]
            }
          ]
        }
      ]
    })
  };

  importScip({ rootDir: tmpDir, scipPath: '/repo/index.src.scip', dbPath, deps });

  const docsCount = Number(execFileSync('sqlite3', [dbPath, 'select count(*) from documents']).toString().trim());
  const symbolsCount = Number(execFileSync('sqlite3', [dbPath, 'select count(*) from symbols']).toString().trim());
  const occurrencesCount = Number(execFileSync('sqlite3', [dbPath, 'select count(*) from occurrences']).toString().trim());
  const defsCount = Number(execFileSync('sqlite3', [dbPath, "select count(*) from occurrences where role='definition'"]).toString().trim());

  assert.equal(docsCount, 1);
  assert.equal(symbolsCount, 1);
  assert.equal(occurrencesCount, 2);
  assert.equal(defsCount, 1);
});

test('importScip deletes existing occurrences for documents before insert', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-import-'));
  const calls = [];
  const deps = {
    fs,
    path,
    execFileSync: (cmd, args, opts = {}) => {
      calls.push({ cmd, args, opts });
      return Buffer.from('');
    },
    parseScipFile: () => ({
      documents: [
        {
          relative_path: 'src/a.ts',
          occurrences: [
            {
              symbol: 'test foo',
              symbol_roles: 1,
              range: [0, 0, 0]
            }
          ]
        }
      ]
    })
  };

  importScip({ rootDir: tmpDir, scipPath: '/repo/index.src.scip', deps });

  const sqlCall = calls.find(call => call.opts && typeof call.opts.input === 'string');
  assert.ok(sqlCall && sqlCall.opts && typeof sqlCall.opts.input === 'string');
  const sql = sqlCall.opts.input;
  const docsInsert = sql.indexOf('INSERT OR IGNORE INTO documents');
  const deleteOccurrences = sql.indexOf('DELETE FROM occurrences');
  assert.ok(docsInsert !== -1);
  assert.ok(deleteOccurrences !== -1);
  assert.ok(deleteOccurrences > docsInsert);
});

test('importScip throws helpful error when sqlite3 is missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-import-'));
  const deps = {
    fs,
    path,
    execFileSync: (cmd, args) => {
      if (Array.isArray(args) && args[0] === '-version') {
        const err = new Error('sqlite3 not found');
        err.code = 'ENOENT';
        throw err;
      }
      return Buffer.from('');
    },
    parseScipFile: () => ({
      documents: [
        { relative_path: 'src/a.ts', occurrences: [] }
      ]
    })
  };

  assert.throws(
    () => importScip({ rootDir: tmpDir, scipPath: '/repo/index.src.scip', deps }),
    /sqlite3.*install/i
  );
});
