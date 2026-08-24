import { useRouter } from 'next/router';
import LabLayout from '../components/LabLayout';
import { appStoreUrl, track } from '../lib/analytics';

// Fallback web page for study-partner invite links (decision 0017). When the
// app is installed, iOS routes stepgunner.com/partner?code=X straight into the
// accept sheet via the AASA and this page never renders. Without the app, the
// recipient lands here: show the code, explain the deal, send them to the
// store under its own campaign token so partner-driven installs are visible.
export default function Partner() {
  const router = useRouter();
  const code = typeof router.query.code === 'string' ? router.query.code.toUpperCase() : '';
  const store = appStoreUrl('partner_invite');
  return (
    <LabLayout
      title="You have a study partner invite"
      eyebrow="Study partners"
      lede="Someone studying for Step 2 CK wants you as a study partner on Step Gunner. Partners share a weekly view, cards done, day streak, practice forms added, and can send one nudge a day when the other is at zero."
      metaTitle="Study partner invite | Step Gunner"
      metaDesc="Accept a Step Gunner study partner invite. Partners see each other's weekly effort and keep each other on pace for Step 2 CK."
      campaign="partner_invite"
      maxWidth={640}
    >
      <style jsx>{`
        .codebox { border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: 16px; padding: 22px; text-align: center; margin: 6px 0 22px; }
        .ck { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .cv { font-family: var(--mono); font-size: 34px; font-weight: 800; letter-spacing: 6px; color: var(--green); margin-top: 6px; }
        .cv.none { color: var(--ink-faint); letter-spacing: 0; font-size: 16px; font-weight: 600; }
        .steps { margin: 0 0 24px; padding-left: 20px; color: var(--ink-dim); font-size: 15px; line-height: 1.7; }
        .steps b { color: var(--ink); }
        .cta { display: inline-block; background: var(--ink); color: #fff; padding: 13px 26px; border-radius: 999px; font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 1px; }
        .cta:hover { box-shadow: 0 8px 26px rgba(13,148,72,0.32); }
        .fine { color: var(--ink-faint); font-size: 12.5px; margin-top: 16px; line-height: 1.55; }
      `}</style>
      <div className="codebox">
        <div className="ck">Partner code</div>
        {code ? <div className="cv">{code}</div>
              : <div className="cv none">This link is missing its code. Ask your partner to resend it.</div>}
      </div>
      <ol className="steps">
        <li><b>Get Step Gunner</b> on the App Store (free).</li>
        <li>Answer a few rounds, then open <b>Leagues &gt; Squad</b>.</li>
        <li>Enter the code under <b>Your partners</b>{code ? <> (or just tap this link again once the app is installed)</> : null}.</li>
      </ol>
      <a href={store} className="cta" onClick={() => track('store_click', { source: 'partner_invite', location: 'partner_page' })}>Get the app</a>
      <p className="fine">Handles on Step Gunner are pseudonyms. Partners see each other&apos;s weekly effort, never scores or personal details, and either side can leave at any time.</p>
    </LabLayout>
  );
}
