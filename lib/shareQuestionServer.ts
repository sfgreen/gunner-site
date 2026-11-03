import fs from 'fs';
import path from 'path';
import { rowProblem, toShareQuestion, type ShareQuestion, type ShareQuestionRow } from './shareQuestion';

// The question file behind stepgunner.com/q/<slug>, read at build time only
// (getStaticPaths and getStaticProps in pages/q/[slug].tsx), so it never reaches
// the browser bundle.
//
// data/share/questions.json is written by the export script in the gunner repo.
// Until it lands, the one-question sample next to it keeps the build working.
// A row that cannot become a page is skipped and logged, so one bad row never
// blocks a deploy; its link 404s until the next export fixes it.

const DIR = path.join(process.cwd(), 'data', 'share');

let cache: ShareQuestion[] | null = null;

export function loadShareQuestions(): ShareQuestion[] {
  if (cache) return cache;
  const real = path.join(DIR, 'questions.json');
  const file = fs.existsSync(real) ? real : path.join(DIR, 'questions.sample.json');
  const name = path.basename(file);
  const rows: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`[share-q] ${name}: expected a JSON array`);

  const out: ShareQuestion[] = [];
  const seen = new Set<string>();
  const skipped: string[] = [];
  rows.forEach((r, i) => {
    const why = rowProblem(r);
    const slug = r && typeof r === 'object' ? String((r as { slug?: unknown }).slug ?? `#${i}`) : `#${i}`;
    if (why) {
      skipped.push(`${slug}: ${why}`);
      return;
    }
    if (seen.has(slug)) {
      skipped.push(`${slug}: duplicate slug, kept the first`);
      return;
    }
    seen.add(slug);
    out.push(toShareQuestion(r as ShareQuestionRow));
  });

  console.log(`[share-q] ${name}: ${out.length} pages, ${skipped.length} skipped`);
  if (name !== 'questions.json') console.warn('[share-q] data/share/questions.json not found: building from the sample');
  skipped.forEach((s) => console.warn(`[share-q] skipped ${s}`));
  cache = out;
  return out;
}
