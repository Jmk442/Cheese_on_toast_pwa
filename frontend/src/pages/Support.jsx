import { Link } from "react-router-dom";
import { ArrowLeft, Mail, RotateCcw, HelpCircle, CreditCard, MessageSquare, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { SeoHead } from "../components/SeoHead";

const CONTACT_EMAIL = "john.create@protonmail.com";
const STRIPE_PORTAL = "https://billing.stripe.com/p/login/bJefZhe2V9O13ir2657Re01";

const FAQS = [
  {
    icon: CreditCard,
    q: "How do I cancel my subscription?",
    a: (
      <>
        You can cancel at any time. From this device, open <Link to="/settings" className="text-brand-primary underline">Settings</Link> — you'll
        find a "Manage subscription" link there that opens your Stripe billing
        portal. You can also reach the portal directly here:{" "}
        <a href={STRIPE_PORTAL} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline inline-flex items-center gap-1">
          billing portal <ExternalLink size={11} />
        </a>
        . Cancellation stops future charges immediately; you keep premium access
        through the end of your paid period.
      </>
    ),
  },
  {
    icon: Mail,
    q: "I didn't get my sign-in email",
    a: (
      <>
        Check your spam / junk folder first. Magic-link emails come from{" "}
        <span className="font-mono">noreply@cheeseontoast.app</span> and expire
        after 15 minutes. If you still can't find it, you can request a fresh
        link from <Link to="/settings" className="text-brand-primary underline">Settings → Link account</Link>.
        Some email providers (Apple iCloud, ProtonMail) can delay delivery by a
        few minutes — wait 5 minutes before re-requesting.
      </>
    ),
  },
  {
    icon: HelpCircle,
    q: "I bought premium but the app still says free",
    a: (
      <>
        First try: close the app, reopen it, then go to <Link to="/settings" className="text-brand-primary underline">Settings</Link> —
        we re-check your subscription on every launch. If it's been more than 5
        minutes since payment and you're still locked out, email us with the email
        you used at checkout and we'll fix it inside one business day.
      </>
    ),
  },
  {
    icon: RotateCcw,
    q: "I want to wipe my progress and start over",
    a: (
      <>
        On the device you want to wipe, open <Link to="/settings" className="text-brand-primary underline">Settings</Link> → scroll
        to "Privacy & Data" → tap "Reset everything on this device" → confirm.
        This clears your achievements, saved recipes, meal plan and device ID.
        Your subscription is unaffected (it's tied to your email, not your device).
      </>
    ),
  },
  {
    icon: Shield,
    q: "How do I delete my account / data?",
    a: (
      <>
        Email us at <span className="font-mono text-brand-primary">{CONTACT_EMAIL}</span>{" "}
        from the email address linked to your account, asking us to delete your
        data. We respond within 30 days, in line with the Australian Privacy
        Principles. Your right to deletion is described in our{" "}
        <Link to="/privacy" className="text-brand-primary underline">Privacy Policy</Link>.
      </>
    ),
  },
  {
    icon: AlertTriangle,
    q: "Something broke / I found a bug",
    a: (
      <>
        Sorry about that. Email <span className="font-mono text-brand-primary">{CONTACT_EMAIL}</span> with:
        <ul className="list-disc pl-5 mt-1 space-y-0.5">
          <li>What page / button you were on</li>
          <li>What you expected to happen</li>
          <li>What actually happened (a screenshot helps a lot)</li>
        </ul>
        We read every message.
      </>
    ),
  },
];

export default function Support() {
  return (
    <div data-testid="support-page" className="space-y-6">
      <SeoHead
        title="Support — Cheese on Toast"
        description="Help, billing, cancellation and contact for Cheese on Toast. Email support and Stripe billing portal."
        canonicalPath="/support"
      />

      <div className="pt-1">
        <Link
          to="/"
          data-testid="support-back-home"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Home
        </Link>
      </div>

      <header className="space-y-2">
        <span className="label-tag">SUPPORT</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Need a hand?
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Real human (John) reads every email. We answer within 1 business day, Australian eastern time.
        </p>
      </header>

      {/* Primary contact card */}
      <section data-testid="contact-card" className="brut-card-yellow p-5 space-y-3">
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink/70">Email us</div>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Cheese%20on%20Toast%20support`}
            data-testid="support-email-link"
            className="block font-display font-black uppercase text-xl sm:text-2xl text-ink hover:underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="font-mono text-xs text-ink/80">
          Cheese on Toast · ABN 82 097 590 964 · Three Centenary Heights, Toowoomba QLD 4350, Australia
        </p>
      </section>

      {/* Quick actions */}
      <section data-testid="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={STRIPE_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="manage-billing-link"
          className="btn-arcade text-left"
        >
          <CreditCard size={18} /> Manage Subscription / Cancel
        </a>
        <Link
          to="/settings"
          data-testid="open-settings-link"
          className="btn-arcade btn-ghost text-left"
        >
          <MessageSquare size={18} /> Account Settings
        </Link>
      </section>

      {/* FAQ */}
      <section data-testid="support-faqs" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Common questions</h2>
        {FAQS.map((faq, i) => {
          const Icon = faq.icon;
          return (
            <details
              key={i}
              data-testid={`faq-${i}`}
              className="brut-card p-4 group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="cursor-pointer flex items-start gap-3 list-none">
                <span className="inline-flex w-8 h-8 items-center justify-center bg-brand-primary text-ink border-2 border-white flex-none">
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <span className="font-display font-bold uppercase text-sm leading-snug flex-1 pt-1">
                  {faq.q}
                </span>
                <span className="font-mono text-foreground/40 text-xs pt-1 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="font-mono text-sm text-foreground/85 leading-relaxed mt-3 pl-11">
                {faq.a}
              </div>
            </details>
          );
        })}
      </section>

      {/* Refund policy */}
      <section data-testid="refund-policy" className="brut-card p-5 space-y-2">
        <h2 className="font-display font-black uppercase tracking-tight text-lg">Refund policy</h2>
        <p className="font-mono text-sm text-foreground/80">
          Cheese on Toast offers a 3-day free trial so you can try every premium
          feature before paying. Subscription fees are generally non-refundable
          once charged, but your rights under the{" "}
          <strong>Australian Consumer Law</strong> are not affected — if a feature
          you paid for is broken, doesn't work as described, or you were charged
          in error, contact us and we will issue a fair refund.
        </p>
      </section>

      {/* Footer links */}
      <section className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono uppercase tracking-widest text-foreground/50">
        <Link to="/privacy" data-testid="support-privacy-link" className="hover:text-brand-primary">Privacy Policy</Link>
        <span className="text-foreground/20">·</span>
        <Link to="/terms" data-testid="support-terms-link" className="hover:text-brand-primary">Terms of Service</Link>
      </section>
    </div>
  );
}
