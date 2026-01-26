const path = require('node:path');

const DEFAULT_DOMAIN_ROOTS = [
  'src',
  'apps',
  'packages',
  'functions',
  'services',
  'workers',
  'dashboard',
  'bin',
  'scripts',
  'insforge-src',
  'insforge-functions'
];

function discoverDomains({ rootDir, fs, path: pathMod = path }) {
  return DEFAULT_DOMAIN_ROOTS
    .map(name => ({ name, fullPath: pathMod.join(rootDir, name) }))
    .filter(entry => {
      try {
        return fs.existsSync(entry.fullPath) && fs.statSync(entry.fullPath).isDirectory();
      } catch (err) {
        return false;
      }
    })
    .map(entry => ({ name: entry.name, paths: [entry.name] }));
}

module.exports = { discoverDomains, DEFAULT_DOMAIN_ROOTS };
