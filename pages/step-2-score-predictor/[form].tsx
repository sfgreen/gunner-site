import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import LabLayout from '../../components/LabLayout';
import { FORM_PAGES, FormPage, formPageBySlug, allFormSlugs } from '../../lib/forms';
import {
  CAL, PASS, formOffset, correctedScore, calibratedCenter, bandHalfWidth, percentile, ordinal,
} from '../../lib/readiness';
import { appStoreUrl, track } from '../../lib/analytics';

// One page per practice form, the structure students actually search
// ("nbme 15 score conversion"). The table is the reason the page exists: a
// printed score maps to a RANGE, computed with the same constants as
// /readiness and the app, so nothing here can drift from the live model.
//
// Table assumption: taken within the last month, which is the 11 point band.
// Stated on the page rather than buried, because the band is the honest part.
const TABLE_BAND = bandHalfWidth(21);          // "Moderate", +/- 11
const TABLE_SCORES = [200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270];

type Row = { printed: number; lo: number; hi: number; mid: number; pctl: number; pass: boolean };

function rows(form: string): Row[] {
  return TABLE_SCORES.map((printed) => {
    const center = calibratedCenter(correctedScore(form, printed));
    const lo = center - TABLE_BAND.band;
    const hi = center + TABLE_BAND.band;
    return { printed, lo, hi, mid: center, pctl: percentile(center), pass: lo >= PASS };
  });
}

export default function FormConversion({ page }: { page: FormPage }) {
  const off = formOffset(page.form);
  const table = rows(page.form);
  const store = appStoreUrl(`predictor_${page.slug.replace(/-/g, '')}`);
  const others = FORM_PAGES.filter((f) => f.slug !== page.slug);
  const canonical = `https://stepgunner.com/step-2-score-predictor/${page.slug}`;

  return (
    <LabLayout
      metaTitle={page.title}
      metaDesc={page.description}
      campaign={`predictor_${page.slug.replace(/-/g, '')}`}
      eyebrow="Score conversion"
      title={page.h1}
      lede={page.lede}
      crumb={[{ href: '/step-2-score-predictor', label: 'Step 2 score predictor' }]}
      head={(
        <>
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={page.h1} />
          <meta property="og:description" content={page.description} />
          <meta property="og:url" content={canonical} />
          <meta property="og:image" content="https://stepgunner.com/api/og" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://stepgunner.com/api/og" />
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: page.faq.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              }),
            }}
          />
        </>
      )}
    >
      <section className="block">
        <p className={'note' + (off === 0 ? '' : off > 0 ? ' low' : ' hot')}>
          <b>
            {off === 0
              ? `${page.form} carries no correction.`
              : off > 0
                ? `${page.form} prints about ${Math.abs(off)} points low.`
                : `${page.form} prints about ${Math.abs(off)} points hot.`}
          </b>{' '}
          {page.note}
        </p>
      </section>

      <section className="block">
        <h2>{page.form} conversion table</h2>
        <p className="sub">
          Printed score to projected Step 2 CK range, for a form taken in the last month.
          The range is about a 68% band: roughly two in three students land inside it, which
          is why it is a range and not a single number. Take the exam further out and the
          band widens.
        </p>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{page.form} printed</th>
                <th className="r">Projected Step 2 CK</th>
                <th className="r">Midpoint</th>
                <th className="r">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.printed} className={r.pass ? '' : 'risk'}>
                  <td className="n"><b>{r.printed}</b></td>
                  <td className="r n">{r.lo} to {r.hi}</td>
                  <td className="r n">{r.mid}</td>
                  <td className="r n">{ordinal(r.pctl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">
          Rows shaded amber have a projected floor below the {PASS} pass line. Percentile is
          against LCME first-takers. Your printed score is never restated as a lower number:
          where a correction applies it lives inside the math, not on your report.
        </p>
        <p className="cta-line">
          <Link href="/step-2-score-predictor" className="btn">
            Blend several forms and add your exam date
          </Link>
        </p>
      </section>

      <section className="block">
        <h2>How the projection works</h2>
        <p>
          Three steps, and the constants are published rather than described.
          {off !== 0 && (
            <> First the printed score is put on the common scale: {page.form}{' '}
              {off > 0 ? 'gains' : 'loses'} {Math.abs(off)} points inside the math.
            </>
          )}{' '}
          Then it is shrunk toward the population mean of {CAL.mean} with a slope of {CAL.slope},
          which is what stops a single high form from projecting a fantasy. Then {CAL.delta} points
          are added for the measured gain from practice form to real exam.
        </p>
        <p>
          Fit on 258 real posted score reports and tested blind on 32 it had never seen: average
          miss 4.1 points, bias statistically zero. Reddit posters skew toward good news, so treat
          the range as honest rather than generous.{' '}
          <Link href="/readiness/methodology">Full methodology</Link>, including where the model
          stops being trustworthy.
        </p>
      </section>

      <section className="block">
        <h2>Questions</h2>
        <dl className="faq">
          {page.faq.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="block">
        <h2>Other forms</h2>
        <ul className="others">
          {others.map((f) => (
            <li key={f.slug}>
              <Link href={`/step-2-score-predictor/${f.slug}`}>{f.form}</Link>
            </li>
          ))}
        </ul>
        <p className="cta-line">
          <a
            href={store}
            className="btn primary"
            onClick={() => track('store_click', { source: `predictor_${page.slug}`, location: 'footer' })}
          >
            Get Step Gunner
          </a>
        </p>
      </section>

      <style jsx>{`
        .block { margin: 0 0 34px; }
        h2 { font-size: 21px; letter-spacing: -0.015em; margin: 0 0 8px; }
        .sub { color: var(--ink-dim); margin: 0 0 14px; }
        .note {
          border-left: 3px solid var(--ink-faint);
          background: var(--bg-3);
          padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 0;
        }
        .note.low { border-left-color: var(--green); }
        .note.hot { border-left-color: var(--gold); }
        .tw { overflow-x: auto; border: 1px solid var(--hair-strong); border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; font-size: 15px; min-width: 460px; }
        th {
          text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
          padding: 11px 14px; background: var(--bg-3);
          border-bottom: 1px solid var(--hair-strong); white-space: nowrap;
        }
        td { padding: 10px 14px; border-bottom: 1px solid var(--hair); background: var(--bg-2); }
        tr:last-child td { border-bottom: none; }
        tr.risk td { background: rgba(224, 142, 0, 0.07); }
        .r { text-align: right; }
        .n { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .fine { font-size: 13.5px; color: var(--ink-dim); margin: 10px 0 0; }
        .cta-line { margin: 16px 0 0; }
        .btn {
          display: inline-block; border: 1px solid var(--hair-strong); border-radius: 8px;
          padding: 9px 16px; font-weight: 600; font-size: 15px;
        }
        .btn.primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
        .faq dt { font-weight: 700; margin: 16px 0 5px; }
        .faq dd { margin: 0; color: var(--ink-dim); }
        .others { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .others li a {
          display: inline-block; border: 1px solid var(--hair-strong); border-radius: 999px;
          padding: 5px 13px; font-family: var(--mono); font-size: 12.5px;
        }
      `}</style>
    </LabLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allFormSlugs().map((form) => ({ params: { form } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const page = formPageBySlug(String(params?.form));
  if (!page) return { notFound: true };
  return { props: { page } };
};
