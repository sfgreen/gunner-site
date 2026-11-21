// Test-only module hook: lets `node --test` load the site's TypeScript libs, whose
// imports name files without an extension (`../proServer`). Node strips the types.
//   node --experimental-transform-types --import ./scripts/ts-resolve.mjs --test <file>
import { register } from 'node:module';

register('data:text/javascript,' + encodeURIComponent(`
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(spec, ctx, next) {
  if ((spec.startsWith('./') || spec.startsWith('../')) && !/\\.[cm]?[jt]sx?$/.test(spec) && ctx.parentURL) {
    for (const ext of ['.ts', '.tsx']) {
      const url = new URL(spec + ext, ctx.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, ctx);
    }
  }
  return next(spec, ctx);
}
`));
