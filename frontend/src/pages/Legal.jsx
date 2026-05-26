import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SeoHead } from "../components/SeoHead";

// ──────────────────────────────────────────────────────────
//  Australia-aligned, plain-English legal pages.
//
//  ⚠️ TEMPLATE ONLY — not legal advice. Replace every __TODO__
//  placeholder with your actual business details before going live,
//  and ideally get a 30-minute review from an Aussie solicitor.
//  Key Aussie laws referenced:
//   • Privacy Act 1988 (Cth) + Australian Privacy Principles (APPs)
//   • Australian Consumer Law (ACL) — Schedule 2 of the Competition and Consumer Act 2010
//   • Spam Act 2003 (Cth)
// ──────────────────────────────────────────────────────────

// Centralised so you only edit business details once.
const BUSINESS = {
  name: "Cheese on Toast",
  legalEntity: "__TODO_LEGAL_ENTITY_NAME__", // e.g. "Cheesy Pty Ltd ACN 123 456 789"
  contactEmail: "__TODO_CONTACT_EMAIL__",     // e.g. "hello@cheeseontoast.app"
  postalAddress: "__TODO_POSTAL_ADDRESS__",   // e.g. "PO Box 1, Sydney NSW 2000"
  jurisdiction: "New South Wales, Australia", // state where you operate
  effectiveDate: "26 February 2026",
};

const SectionHeading = ({ children, id }) => (
  <h2 id={id} className="font-display font-black uppercase tracking-tight text-xl pt-4">
    {children}
  </h2>
);

const P = ({ children }) => (
  <p className="font-mono text-sm leading-relaxed text-foreground/85">{children}</p>
);

const UL = ({ children }) => (
  <ul className="font-mono text-sm leading-relaxed text-foreground/85 list-disc pl-5 space-y-1">
    {children}
  </ul>
);

const Card = ({ children, testid }) => (
  <div data-testid={testid} className="brut-card p-5 space-y-3">{children}</div>
);

const BackLink = () => (
  <div className="pt-1">
    <Link
      to="/"
      data-testid="legal-back-home"
      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
    >
      <ArrowLeft size={14} /> Home
    </Link>
  </div>
);

// ───────────────────────── PRIVACY ─────────────────────────
export function Privacy() {
  return (
    <div data-testid="privacy-page" className="space-y-6">
      <SeoHead
        title="Privacy Policy — Cheese on Toast"
        description="How we collect, use and protect your information. Compliant with the Australian Privacy Principles."
        canonicalPath="/privacy"
      />
      <BackLink />

      <header className="space-y-2">
        <span className="label-tag">PRIVACY POLICY</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-foreground/60">Effective: {BUSINESS.effectiveDate}</p>
      </header>

      <Card testid="privacy-summary">
        <P>
          <strong>Short version:</strong> we collect the minimum needed to run the app —
          an anonymous device ID, your email if you choose to link one, your achievements
          and usage analytics, and (if you pay) your Stripe payment metadata. We don't
          sell your data. We're an Australian business and we follow the
          Australian Privacy Principles (APPs) under the <em>Privacy Act 1988 (Cth)</em>.
        </P>
      </Card>

      <SectionHeading id="who">1. Who we are</SectionHeading>
      <P>
        This app, <strong>{BUSINESS.name}</strong> ("we", "us", "our"), is operated by{" "}
        <strong>{BUSINESS.legalEntity}</strong>. You can contact us at{" "}
        <span className="text-brand-primary">{BUSINESS.contactEmail}</span>{" "}
        or by mail at {BUSINESS.postalAddress}.
      </P>

      <SectionHeading id="collect">2. What we collect</SectionHeading>
      <UL>
        <li><strong>Anonymous device ID</strong> — a random ID generated in your browser to remember your achievements and subscription on this device.</li>
        <li><strong>Email address</strong> — only if you choose to link an email for cross-device sync via our magic-link sign-in.</li>
        <li><strong>App activity</strong> — which simulators you play, outcomes, badges earned, theme selections, page views.</li>
        <li><strong>Payment metadata</strong> — if you subscribe, our payment processor Stripe handles the card itself. We only receive a Stripe customer/session ID, the package you bought, and renewal/expiry dates. <strong>We never see your card number.</strong></li>
        <li><strong>Technical data</strong> — IP address, browser type and operating system, captured in standard server logs for security and debugging.</li>
        <li><strong>Cookies & local storage</strong> — we use browser <code>localStorage</code> to remember your settings and achievements offline. No third-party advertising cookies.</li>
      </UL>

      <SectionHeading id="why">3. Why we collect it</SectionHeading>
      <UL>
        <li>To run the app and keep your progress between visits.</li>
        <li>To process subscription payments and grant access to premium features.</li>
        <li>To send you a one-tap sign-in link when you ask for one.</li>
        <li>To understand which features are being used so we can build better ones.</li>
        <li>To protect against fraud, abuse and bot traffic.</li>
        <li>To meet our legal obligations (tax, consumer law, etc.).</li>
      </UL>

      <SectionHeading id="share">4. Who we share it with</SectionHeading>
      <P>We use the following third-party processors — each is contractually bound to protect your data:</P>
      <UL>
        <li><strong>Stripe, Inc.</strong> — payment processing. Stripe is PCI-DSS compliant. <a className="underline text-brand-primary" href="https://stripe.com/au/privacy" target="_blank" rel="noreferrer">stripe.com/au/privacy</a></li>
        <li><strong>Resend, Inc.</strong> — sending magic-link sign-in emails. <a className="underline text-brand-primary" href="https://resend.com/legal/privacy-policy" target="_blank" rel="noreferrer">resend.com/legal/privacy-policy</a></li>
        <li><strong>Emergent Labs (hosting platform)</strong> — runs our backend infrastructure.</li>
        <li><strong>MongoDB Atlas</strong> — hosted database for your account & achievements.</li>
        <li><strong>Google (Gemini API)</strong> — used internally to generate the AI illustrations on our recipe pages. <strong>Your personal data is not sent to Google.</strong></li>
      </UL>
      <P>We <strong>do not</strong> sell your personal information, ever.</P>

      <SectionHeading id="overseas">5. Overseas disclosure</SectionHeading>
      <P>
        Some of our processors (Stripe, Resend, MongoDB Atlas) store data on servers
        in the United States and the European Union. By using the app, you consent to
        the overseas transfer of your data to these jurisdictions for the purposes
        described above. We take reasonable steps to ensure these providers handle
        your data in line with the APPs.
      </P>

      <SectionHeading id="retain">6. How long we keep it</SectionHeading>
      <UL>
        <li><strong>Device records & achievements:</strong> until you reset them in Settings, or 24 months of inactivity.</li>
        <li><strong>Account / email links:</strong> until you ask us to delete the account.</li>
        <li><strong>Payment transactions:</strong> 7 years, as required by Australian tax law.</li>
        <li><strong>Magic-link tokens:</strong> 15 minutes (auto-expired).</li>
      </UL>

      <SectionHeading id="rights">7. Your rights</SectionHeading>
      <P>Under the Privacy Act, you have the right to:</P>
      <UL>
        <li>Access the personal information we hold about you;</li>
        <li>Ask us to correct it if it's wrong;</li>
        <li>Ask us to delete your account and associated data;</li>
        <li>Withdraw consent for marketing emails at any time;</li>
        <li>Complain to the Office of the Australian Information Commissioner (OAIC) at <a className="underline text-brand-primary" href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">oaic.gov.au</a> if you're not happy with how we've handled your information.</li>
      </UL>
      <P>
        To exercise any of these, email <span className="text-brand-primary">{BUSINESS.contactEmail}</span>.
        We'll respond within 30 days.
      </P>

      <SectionHeading id="kids">8. Children</SectionHeading>
      <P>
        This app is rated suitable for ages 13+. We don't knowingly collect personal
        information from under-13s. If you believe a child has signed up, email us and
        we will delete the account.
      </P>

      <SectionHeading id="security">9. Security</SectionHeading>
      <P>
        We use industry-standard measures: HTTPS everywhere, hashed tokens, isolated
        databases, and least-privilege access. No system is perfectly secure though —
        if a data breach affects you, we will notify you and the OAIC as required by
        the Notifiable Data Breaches scheme.
      </P>

      <SectionHeading id="changes">10. Changes to this policy</SectionHeading>
      <P>
        We may update this policy from time to time. We'll post the new version here
        with an updated effective date. Material changes will also be announced inside
        the app.
      </P>

      <SectionHeading id="contact">11. Contact</SectionHeading>
      <Card testid="privacy-contact">
        <P>
          {BUSINESS.legalEntity}<br />
          {BUSINESS.postalAddress}<br />
          <span className="text-brand-primary">{BUSINESS.contactEmail}</span>
        </P>
      </Card>

      <div className="pt-4 pb-2 flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-foreground/50">
        <Link to="/terms" data-testid="privacy-link-terms" className="hover:text-brand-primary">Terms of Service →</Link>
      </div>
    </div>
  );
}

// ────────────────────────── TERMS ──────────────────────────
export function Terms() {
  return (
    <div data-testid="terms-page" className="space-y-6">
      <SeoHead
        title="Terms of Service — Cheese on Toast"
        description="The terms governing your use of the Cheese on Toast app and premium subscription."
        canonicalPath="/terms"
      />
      <BackLink />

      <header className="space-y-2">
        <span className="label-tag">TERMS OF SERVICE</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Terms of Service
        </h1>
        <p className="font-mono text-xs text-foreground/60">Effective: {BUSINESS.effectiveDate}</p>
      </header>

      <Card testid="terms-summary">
        <P>
          <strong>Short version:</strong> we provide a cooking guide and food-cooking
          simulator app. It's for entertainment and education — not professional cooking
          or food-safety advice. We charge a subscription if you want premium content.
          You can cancel anytime. We're based in {BUSINESS.jurisdiction}; Australian
          Consumer Law applies and nothing in these terms takes those rights away.
        </P>
      </Card>

      <SectionHeading id="parties">1. Who these terms are between</SectionHeading>
      <P>
        These terms ("Terms") form a binding agreement between you ("you", "your") and{" "}
        <strong>{BUSINESS.legalEntity}</strong> trading as <strong>{BUSINESS.name}</strong>
        {" "}("we", "us"). By using the app you agree to these Terms.
      </P>

      <SectionHeading id="age">2. Eligibility</SectionHeading>
      <P>
        You must be at least 13 years old to use the app. If you are under 18, you
        must have a parent or guardian's permission to subscribe.
      </P>

      <SectionHeading id="account">3. Your account</SectionHeading>
      <UL>
        <li>You can use the app anonymously with a device ID, or link an email for cross-device sync.</li>
        <li>You're responsible for keeping access to your email secure — anyone with access to it can sign in to your linked account.</li>
        <li>Keep your details accurate. We can suspend or terminate accounts that abuse the service.</li>
      </UL>

      <SectionHeading id="subscriptions">4. Premium subscription & payment</SectionHeading>
      <UL>
        <li><strong>Pricing.</strong> All prices are in <strong>Australian Dollars (AUD)</strong> and include any applicable GST.</li>
        <li><strong>Free trial.</strong> New users get a 3-day free trial of premium. We do not require a card to start the trial.</li>
        <li><strong>Monthly subscription.</strong> A$3.99 per month, billed in advance via Stripe. Renews automatically each month until cancelled.</li>
        <li><strong>Lifetime.</strong> A$24.99 one-off. Grants premium access for the lifetime of the app, but the app itself is not guaranteed to operate forever (see Section 9).</li>
        <li><strong>Cancellation.</strong> You can cancel anytime in Settings or via the Stripe customer portal. Cancellation stops future charges; the current paid period continues to the end of its term.</li>
        <li><strong>Refunds.</strong> Australian Consumer Law guarantees apply — see Section 7. Outside those guarantees, fees are generally non-refundable, but contact us if something has gone wrong and we'll act in good faith.</li>
      </UL>

      <SectionHeading id="acceptable">5. Acceptable use</SectionHeading>
      <P>You agree not to:</P>
      <UL>
        <li>Use the app for anything illegal under Australian law;</li>
        <li>Attempt to access or scrape other users' data;</li>
        <li>Reverse engineer, decompile or otherwise extract source code;</li>
        <li>Resell, sublicense or commercially redistribute premium content;</li>
        <li>Send abusive, harassing or spam content via any in-app feature.</li>
      </UL>

      <SectionHeading id="ip">6. Intellectual property</SectionHeading>
      <P>
        All recipes, simulator code, AI-generated illustrations, badge artwork, copy
        and branding are owned by us or our licensors. You get a personal,
        non-exclusive, non-transferable licence to use them through the app. You can
        share screenshots and share-cards on social media as long as you don't remove
        our watermarks.
      </P>

      <SectionHeading id="acl">7. Australian Consumer Law</SectionHeading>
      <P>
        Our services come with consumer guarantees under the{" "}
        <em>Competition and Consumer Act 2010 (Cth)</em> that cannot be excluded.
        You are entitled to:
      </P>
      <UL>
        <li>Services provided with due care and skill;</li>
        <li>Services fit for any purpose we've described;</li>
        <li>Services provided within a reasonable time.</li>
      </UL>
      <P>
        If we fail a consumer guarantee, you may be entitled to a refund, cancellation
        of the service or compensation for reasonably foreseeable loss. Nothing in
        these Terms limits those rights.
      </P>

      <SectionHeading id="food">8. ⚠️ Food, fire & safety disclaimer</SectionHeading>
      <Card testid="food-safety-warning">
        <P>
          <strong>The simulators are entertainment.</strong> They are <em>not</em> a
          substitute for real food-safety guidance, fire training or supervision in
          the kitchen. Cooking involves hot surfaces, hot liquids, open flames and
          sharp tools. You are responsible for:
        </P>
        <UL>
          <li>Adult supervision if you are under 18;</li>
          <li>Following your appliance manufacturer's instructions;</li>
          <li>Working smoke alarms in your home;</li>
          <li>Never leaving food cooking unattended;</li>
          <li>Knowing how to put out a kitchen fire (turn off the heat, smother — never use water on an oil/fat fire);</li>
          <li>Allergies, dietary restrictions and food hygiene.</li>
        </UL>
        <P>
          To the extent permitted by law, we are not liable for personal injury,
          property damage, fires or food poisoning resulting from real-world cooking
          undertaken after using the app.
        </P>
      </Card>

      <SectionHeading id="availability">9. Availability & changes</SectionHeading>
      <P>
        We try to keep the app running 24/7 but we don't guarantee uninterrupted
        service. We may add, remove or change features. If we discontinue the app
        entirely and you hold an active lifetime licence, we will offer a pro-rata
        refund where reasonably practicable.
      </P>

      <SectionHeading id="liability">10. Limitation of liability</SectionHeading>
      <P>
        Subject to Section 7 (Australian Consumer Law) and to the maximum extent
        permitted by law:
      </P>
      <UL>
        <li>We are not liable for indirect, consequential, incidental or special losses;</li>
        <li>Our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim arose (or A$50 if you haven't paid us anything).</li>
      </UL>

      <SectionHeading id="termination">11. Termination</SectionHeading>
      <P>
        You can stop using the app any time. We can suspend or terminate your access
        if you breach these Terms, with notice where reasonable. On termination, any
        clauses that should reasonably survive (IP, liability, payments due) will
        continue to apply.
      </P>

      <SectionHeading id="law">12. Governing law</SectionHeading>
      <P>
        These Terms are governed by the laws of <strong>{BUSINESS.jurisdiction}</strong>.
        Any dispute will be handled by the courts of that state, except that nothing
        in this clause limits your ability to bring a complaint in your home state
        if you live elsewhere in Australia.
      </P>

      <SectionHeading id="contact-t">13. Contact</SectionHeading>
      <Card testid="terms-contact">
        <P>
          {BUSINESS.legalEntity}<br />
          {BUSINESS.postalAddress}<br />
          <span className="text-brand-primary">{BUSINESS.contactEmail}</span>
        </P>
      </Card>

      <div className="pt-4 pb-2 flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-foreground/50">
        <Link to="/privacy" data-testid="terms-link-privacy" className="hover:text-brand-primary">Privacy Policy →</Link>
      </div>
    </div>
  );
}
