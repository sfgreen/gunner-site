// Compiles lib/readiness.ts into public/free120/readiness.js, a browser ES module the
// static Free 120 pages import for the "add your NBME scores" box on results. The
// pages are plain files under public/, so they cannot import the TypeScript; this
// keeps ONE readiness model (the same one /readiness and the app use) instead of a
// hand copy that drifts.
//
// Runs as `prebuild`, so every Vercel build regenerates it. `--check` exits 1 when
// the committed file is stale (run it before committing a lib/readiness.ts change).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'lib/readiness.ts');
const out = path.join(root, 'public/free120/readiness.js');
const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');

const tmp = mkdtempSync(path.join(tmpdir(), 'f120r-'));
try {
  execFileSync(process.execPath, [
    tsc, src, '--outDir', tmp, '--target', 'es2019', '--module', 'es2020',
    '--lib', 'es2019,dom', '--skipLibCheck', '--removeComments', '--strict', 'false',
  ], { stdio: 'inherit' });
  const js = readFileSync(path.join(tmp, 'readiness.js'), 'utf8');
  const banner = '// GENERATED from lib/readiness.ts by scripts/build_free120_readiness.mjs. Do not edit.\n';
  const next = banner + js;
  if (process.argv.includes('--check')) {
    const cur = existsSync(out) ? readFileSync(out, 'utf8') : '';
    if (cur !== next) {
      console.error('public/free120/readiness.js is stale: run node scripts/build_free120_readiness.mjs');
      process.exit(1);
    }
    console.log('public/free120/readiness.js is current');
  } else {
    writeFileSync(out, next);
    console.log(`wrote ${path.relative(root, out)} (${next.length} bytes)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
