const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const { scip } = require('@sourcegraph/scip-typescript/dist/src/scip');

test('parseScipFile deserializes scip index', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-scip-'));
  const scipPath = path.join(tempDir, 'index.scip');
  const index = new scip.Index({ documents: [] });
  fs.writeFileSync(scipPath, index.serializeBinary());

  const autoIndexPath = path.join(
    __dirname,
    '..',
    'scripts',
    'graph',
    'auto-index.cjs'
  );
  const code = `${fs.readFileSync(autoIndexPath, 'utf8')}\nmodule.exports._test = { parseScipFile };`;
  const localRequire = createRequire(autoIndexPath);
  const sandbox = {
    require: localRequire,
    module: { exports: {} },
    exports: {},
    __filename: autoIndexPath,
    __dirname: path.dirname(autoIndexPath)
  };

  vm.runInNewContext(code, sandbox);
  const { parseScipFile } = sandbox.module.exports._test;

  const parsed = parseScipFile(scipPath);
  assert.equal(parsed.documents.length, 0);
});
