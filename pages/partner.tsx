import { useRouter } from 'next/router';
import { AppShell, ArticleHeader, Hero, NumberedSteps, StoreButton } from '../components/app';
import { PageHead, ResearchStyles } from '../components/app/research';

// Fallback web page for study-partner invite links (decision 0017). When the
// app is installed, iOS routes stepgunner.com/partner?code=X straight into the
// accept sheet via the AASA and this page never renders. Without the app, the
// recipient lands here: show the code, explain the deal, send them to the
// store under its own campaign token so partner-driven installs are visible.
// Built from the app-look blocks (components/app/README.md).
export default function Partner() {
  const router = useRouter();
  const code = typeof router.query.code === 'string' ? router.query.code.toUpperCase() : '';
  return (
    <>
      <PageHead
        metaTitle="Study partner invite | Step Gunner"
        metaDesc="Accept a Step Gunner study partner invite. Partners see each other's weekly effort and keep each other on pace for Step 2 CK."
      />
      <AppShell campaign="partner_invite" pageType="tool">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="site"
            eyebrow="Study partners"
            title="You have a study partner invite"
            accent="study partner invite"
            dek="Someone studying for Step 2 CK wants you as a study partner on Step Gunner. Partners share a weekly view, cards done, day streak, practice forms added, and can send one nudge a day when the other is at zero."
            byline={false}
          />
          <div className="mk isl">
            <div className="rs-pt-col">
              <section className="sheet rs-code" aria-labelledby="rs-code-k">
                <div className="sheet-bd">
                  <h2 className="lbl" id="rs-code-k">Partner code</h2>
                  {code ? <p className="rs-code-v num">{code}</p>
                    : <p className="rs-code-none">This link is missing its code. Ask your partner to resend it.</p>}
                </div>
              </section>
              <NumberedSteps steps={[
                { text: <><b>Get Step Gunner</b> on the App Store (free).</> },
                { text: <>Answer a few rounds, then open <b>Leagues &gt; Squad</b>.</> },
                { text: <>Enter the code under <b>Your partners</b>{code ? <> (or just tap this link again once the app is installed)</> : null}.</> },
              ]} />
              <div className="rs-act"><StoreButton loc="top" lg>Get the app</StoreButton></div>
              <p className="rs-fine">Handles on Step Gunner are pseudonyms. Partners see each other&apos;s weekly effort, never scores or personal details, and either side can leave at any time.</p>
            </div>
          </div>
        </Hero>
      </AppShell>
      <style jsx global>{`
        .mk .rs-pt-col { max-width: 640px; margin-top: 32px; padding-bottom: 64px; }
        .mk .rs-code .sheet-bd { display: grid; gap: 8px; justify-items: start; }
        .mk .rs-code-v { font: 800 38px/1.1 var(--f-mono); letter-spacing: .12em; color: var(--ink); overflow-wrap: anywhere; }
        .mk .rs-code-none { font-size: 18px; font-weight: 600; color: var(--ink-2); }
        .mk .rs-pt-col .steps { margin-top: 24px; }
        @media (min-width: 760px) { .mk .rs-pt-col { padding-bottom: 88px; } }
      `}</style>
    </>
  );
}
