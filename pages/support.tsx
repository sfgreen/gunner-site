import DocLayout from '../components/DocLayout';

export default function Support() {
  return (
    <DocLayout
      title="Support"
      subtitle="We're here to help"
      metaTitle="Support — Step Gunner | Rezumab LLC"
      metaDesc="Get help with Step Gunner. Contact our support team."
    >
      <div className="contact-box">
        <h2>Contact Us</h2>
        <p>Have a question, found a bug, or need help with your account? Reach out and we&apos;ll get back to you as soon as possible.</p>
        <p>
          <strong>Email:</strong> <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a><br />
          <strong>Company:</strong> Rezumab LLC<br />
          <strong>Location:</strong> Texas, USA
        </p>
        <p>We typically respond within 24 hours.</p>
      </div>

      <h2>Frequently Asked Questions</h2>

      <div className="faq-item">
        <h3>How do I cancel my subscription?</h3>
        <p>Go to <strong>Settings &gt; Apple ID &gt; Subscriptions</strong> on your iPhone. Find Step Gunner Pro and tap Cancel Subscription. You&apos;ll retain access until the end of your current billing period.</p>
      </div>

      <div className="faq-item">
        <h3>How do I restore my purchase on a new device?</h3>
        <p>Open the app, tap any locked section to open the paywall, then tap <strong>Restore Purchase</strong> at the bottom. Make sure you&apos;re signed in with the same Apple ID used for the original purchase.</p>
      </div>

      <div className="faq-item">
        <h3>How do I delete my account?</h3>
        <p>Go to <strong>Profile &gt; Delete Account</strong> at the bottom of the Profile tab. This permanently removes all your data from our servers. This action cannot be undone.</p>
      </div>

      <div className="faq-item">
        <h3>I found an incorrect question. How do I report it?</h3>
        <p>During a quiz, tap the <strong>flag icon</strong> on any question to submit a report. Include the reason and any notes. We review all reports and update questions regularly &mdash; and you get a little celebration when a fix you reported goes live.</p>
      </div>

      <div className="faq-item">
        <h3>Does the app work offline?</h3>
        <p>Yes. All questions are stored on your device. You can study without an internet connection. Progress syncs to the cloud when you&apos;re back online.</p>
      </div>

      <div className="faq-item">
        <h3>What devices are supported?</h3>
        <p>Step Gunner requires an iPhone running iOS 17 or later.</p>
      </div>
    </DocLayout>
  );
}
