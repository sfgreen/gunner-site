import { useEffect } from 'react';
import { AppShell, StoreButton } from '../components/app';
import ProStyles from '../components/ProStyles';
import { track } from '../lib/analytics';
import { CHROME_STORE_URL } from '../lib/uworldCompanion';

// stepgunner.com/uworld: the Step Gunner Companion, a Chrome extension that puts the
// UWorld questions a student misses or marks on TODAY in the app (gunner decision 0087).
// "Add to Chrome" waits for the public listing (CHROME_STORE_URL). No em or en dashes.

export default function UWorldCompanion() {
  useEffect(() => { track('uworld_page_view', { listed: CHROME_STORE_URL ? 1 : 0 }); }, []);
  return (
    <AppShell
      campaign="uworld_companion"
      pageType="tool"
      section={null}
      seo={{
        title: 'Step Gunner Companion for UWorld',
        description: 'Review UWorld as usual. The questions you miss land on TODAY in Step Gunner, ready to knock out.',
        path: '/uworld',
      }}
    >
      <div className="pro-wrap uw-wrap">
        <section className="pro-card">
          <div className="pro-stack">
            <span className="uw-eyebrow">STEP GUNNER COMPANION</span>
            <h1 className="pro-h2-lg">Your UWorld misses, on TODAY.</h1>
            <p className="pro-muted">
              Review UWorld blocks the way you already do. The Companion notes each question you miss or mark, and
              Step Gunner turns it into a knockout list: our questions on the same topic, in rounds of 10, until you
              get each one right.
            </p>
            <ol className="uw-steps">
              <li><b>Add it to Chrome</b> on your laptop. Edge and Brave work too.</li>
              <li><b>Scan the code it shows</b> with your iPhone camera and tap Connect.</li>
              <li><b>Review UWorld as usual.</b> There is nothing to click after that.</li>
            </ol>
            {CHROME_STORE_URL ? (
              <a className="pro-btn pro-primary uw-add" href={CHROME_STORE_URL} target="_blank" rel="noopener"
                 onClick={() => track('uworld_add_tap', {})}>
                Add to Chrome
              </a>
            ) : (
              <span className="pro-btn uw-add uw-soon" aria-disabled="true">Coming to the Chrome Web Store</span>
            )}
            <StoreButton loc="inline" variant="q" block>Get Step Gunner for iPhone</StoreButton>
            <p className="pro-fine">
              The Companion reads only the topic of each question you miss or mark, turned into a one-way code
              before it leaves your browser. It never reads the question, the answers or the explanation. Not
              affiliated with or endorsed by UWorld.
            </p>
          </div>
        </section>
      </div>
      <ProStyles />
      <style jsx>{`
        .uw-wrap { justify-content: center; padding-top: 48px; padding-bottom: 72px; }
        .uw-eyebrow { font: 600 12px/1 var(--mono, ui-monospace, Menlo, monospace); letter-spacing: .14em; opacity: .7; }
        .uw-steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
        .uw-add { align-self: stretch; text-align: center; text-decoration: none; }
        .uw-soon { opacity: .6; cursor: default; }
      `}</style>
    </AppShell>
  );
}
