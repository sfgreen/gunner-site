import DocLayout from '../components/DocLayout';

export default function Privacy() {
  return (
    <DocLayout
      title="Privacy Policy"
      subtitle="Step Gunner by Rezumab LLC · Effective November 21, 2026"
      metaTitle="Privacy Policy | Step Gunner | Rezumab LLC"
      metaDesc="Privacy Policy for Step Gunner by Rezumab LLC. Your study data stays on your device."
    >
      <div className="highlight-box">
        <strong>The short version: We collect only what&apos;s needed to run the app.</strong>
        <p>Step Gunner is a USMLE Step 2 CK study app. We use Firebase for authentication and to sync your progress across devices. We do not sell your data or use third-party advertising.</p>
      </div>

      <h2>Overview</h2>
      <p>Step Gunner is a medical education quiz application developed by Rezumab LLC. It helps medical students prepare for the USMLE Step 2 CK exam through gamified flashcard-based learning with spaced repetition. This policy describes our data practices.</p>

      <h2>Information We Collect</h2>
      <p>When you sign in with Google or Apple, we collect:</p>
      <ul>
        <li>Your name and email address (from your sign-in provider)</li>
        <li>A profile avatar you choose in the app</li>
      </ul>
      <p>As you use the App, we collect and store:</p>
      <ul>
        <li>Quiz performance data (answers, scores, streaks, accuracy)</li>
        <li>Spaced repetition progress (which cards you&apos;ve studied and your mastery level)</li>
        <li>Leaderboard scores (weekly XP, accuracy, streaks)</li>
        <li>Achievement and streak data</li>
      </ul>
      <p>This data is stored both locally on your device and in our cloud database (Google Firebase) to enable cross-device sync.</p>

      <h2>How We Use Your Data</h2>
      <ul>
        <li>To provide personalized spaced repetition and track your study progress</li>
        <li>To display your name and scores on the weekly leaderboard</li>
        <li>To sync your progress across devices</li>
        <li>To send study reminder notifications (if you enable them)</li>
      </ul>

      <h2>Information We Do Not Collect</h2>
      <p>Step Gunner does not collect, store, or transmit any of the following:</p>
      <ul>
        <li>Device identifiers or advertising IDs</li>
        <li>Location data</li>
        <li>Cookies or tracking technologies for advertising</li>
      </ul>
      <p>We do not use any advertising networks or social media SDKs. We use Google Analytics only to understand usage so we can improve the app: which screens are opened, and the words typed into the app&apos;s search (lowercased, at most 60 characters, and never anything that looks like an email address or phone number), so we can see which topics students look for. When you sign in on stepgunner.com (for example to get Pro), we link that browser&apos;s visits to stepgunner.com to your Step Gunner account, so we can see which pages led you to us. We never sell this or use it for advertising.</p>

      <h2>Question Reports</h2>
      <p>When you flag a question using the in-app report feature, the following information is sent to help us improve question quality:</p>
      <ul>
        <li>The question text (truncated to 200 characters)</li>
        <li>The correct answer and your selected answer</li>
        <li>The answer choices shown</li>
        <li>The category and question ID</li>
        <li>Your reason for reporting and optional notes</li>
        <li>A timestamp of when the report was submitted</li>
      </ul>
      <p>These reports are used solely to identify and fix incorrect or unclear questions.</p>

      <h2>AI Features (Pro)</h2>
      <p>In version 3.5 and later, Pro students can use Ask Gunner, the tutor after a missed question, and the score report reader. Each runs only after you allow it in the app, and only when you use it:</p>
      <ul>
        <li><strong>Ask Gunner:</strong> the question you type, and the Step Gunner cards it is answered from, are sent to Anthropic to write the answer.</li>
        <li><strong>The tutor:</strong> the question you missed and the answer you picked are sent to Anthropic.</li>
        <li><strong>The score report reader:</strong> the screenshot you choose is sent to Anthropic to be read. It is not stored; only the numbers you confirm are saved to your account.</li>
      </ul>
      <p>Your name and email are not sent. Anthropic does not train its models on this data and keeps it for up to 30 days, longer only if it is flagged for a policy violation. We keep a daily count of your AI requests to apply the daily limits.</p>

      <h2>Third-Party Services</h2>
      <p>The App uses the following third-party services:</p>
      <ul>
        <li><strong>Firebase Authentication</strong> (Google LLC): for sign-in via Google and Apple</li>
        <li><strong>Cloud Firestore</strong> (Google LLC): for securely storing user profiles, study progress, and leaderboard data</li>
        <li><strong>Anthropic</strong> (Claude): for the Pro AI features described above</li>
        <li><strong>Apple Foundation Models</strong>: for on-device AI explanations (processed entirely on your device, no data sent to external servers)</li>
      </ul>

      <h2>Data Storage &amp; Security</h2>
      <p>Your data is stored securely using Google Firebase infrastructure. Study progress is also cached locally on your device for offline use. All data is transmitted over HTTPS. We do not sell or rent your personal data, and we share it only with the service providers listed above, to run the App.</p>

      <h2>Data Retention &amp; Deletion</h2>
      <p>We retain your data as long as your account is active. You can delete your account at any time from the Profile tab in the app, which permanently removes all your data from our servers. Deleting the app from your device removes all locally stored data.</p>

      <h2>Children&apos;s Privacy</h2>
      <p>Step Gunner is designed for medical students and healthcare professionals. It is not directed at children under 13, and we do not knowingly collect information from anyone under 13.</p>

      <h2>Medical Disclaimer</h2>
      <p>Step Gunner is for educational purposes only. It is not a substitute for medical education, clinical training, or professional medical advice. Always consult authoritative medical resources and supervising physicians for clinical decision-making.</p>

      <h2>Changes to This Policy</h2>
      <p>If we update this privacy policy, changes will be posted on this page with an updated effective date.</p>

      <div className="contact-box">
        <h2>Contact Us</h2>
        <p>Questions about this Privacy Policy or Step Gunner?</p>
        <p>
          <strong>Email:</strong> <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a><br />
          <strong>Company:</strong> Rezumab LLC<br />
          <strong>State:</strong> Texas, USA
        </p>
      </div>
    </DocLayout>
  );
}
