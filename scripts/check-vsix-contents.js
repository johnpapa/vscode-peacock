#!/usr/bin/env node
// Packages the extension and fails if dev-only files leak into the VSIX, or if
// the package grows unexpectedly large. Run after `npm run vscode:prepublish`.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Path prefixes that should never ship in the VSIX. Add to this list whenever
// new dev-only tooling/config is added to the repo root.
const DISALLOWED_PREFIXES = [
  '.claude/',
  '.husky/',
  '.github/',
  'coverage/',
  'src/test/',
  'testworkspace/',
  'e2e/',
  'docs/',
  'node_modules/',
];

// Exact dev-only filenames that should never ship, regardless of location.
const DISALLOWED_FILENAMES = new Set([
  'eslint.config.js',
  'tsconfig.eslint.json',
  'vitest.config.ts',
  '.eslintrc',
  '.prettierrc.js',
]);

const MAX_VSIX_KB = 2048; // ~8x the ~250KB historical package size, generous headroom

function fail(message) {
  console.error(`\n❌ VSIX content check failed: ${message}\n`);
  process.exit(1);
}

const listing = execFileSync('npx', ['@vscode/vsce', 'ls'], { encoding: 'utf8' });
const files = listing
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const violations = files.filter(file => {
  const filename = path.posix.basename(file);
  if (DISALLOWED_FILENAMES.has(filename)) {
    return true;
  }
  return DISALLOWED_PREFIXES.some(prefix => file.startsWith(prefix));
});

if (violations.length > 0) {
  fail(
    `these dev-only paths are included in the VSIX and should be excluded via .vscodeignore:\n  ${violations.join(
      '\n  ',
    )}`,
  );
}

const tmpVsix = path.join(os.tmpdir(), `peacock-package-check-${Date.now()}.vsix`);
try {
  execFileSync(
    'npx',
    ['@vscode/vsce', 'package', '--out', tmpVsix, '--no-dependencies', '--allow-star-activation'],
    { encoding: 'utf8' },
  );
  const { size } = fs.statSync(tmpVsix);
  const sizeKb = size / 1024;
  console.log(`VSIX package size: ${sizeKb.toFixed(2)} KB (${files.length} files)`);
  if (sizeKb > MAX_VSIX_KB) {
    fail(`package is ${sizeKb.toFixed(2)} KB, over the ${MAX_VSIX_KB} KB threshold`);
  }
} finally {
  fs.rmSync(tmpVsix, { force: true });
}

console.log('✅ VSIX contents look clean.');
