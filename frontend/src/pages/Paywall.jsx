import { Link } from "react-router-dom";
import { Crown, Check, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { usePremium } from "../context/PremiumContext";
import { SeoHead } from "../components/SeoHead";
import { COLLECTIONS } from "../data/collections";
import { track } from "../lib/analytics";
import { useEffect, useState } from "react";

const PERKS = [
  "10 premium collections (Moving Out, Budget, Air Fryer, Study Snacks, Late Night, Seasonal)",
  "Weekly meal plans + auto grocery lists",
  "Offline access to saved recipes",
  "Premium badges + advanced achievements",
  "Kitchen cosmetics — 4 themes",
  "Cancel anytime. No fine print.",
];

export default function Paywall() {
  const { isPremium, isLifetime, isTrial, trialDaysLeft, startCheckout, premium } = usePremium();
  const [pkg, setPkg] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { track("paywall_screen_view"); }, []);

  const handleStart = async (which) => {
    setErr(null);
    setBusy(true);
    track("paywall_buy_click", { package: which });
    try {
      await startCheckout(which);
    } catch (e) {
      setErr("Couldn't start checkout. Try again in a moment.");
      setBusy(false);
    }
  };

  return (
    <div data-testid="paywall-page" className="space-y-8">
      <SeoHead
        title="Premium — Cheese on Toast"
        description="3-day free trial. A$3.99/mo or one-time A$24.99 lifetime. Unlock 10 recipe collections, meal planner, grocery lists, offline access and cosmetics."
        canonicalPath="/premium"
      />

      <div className="pt-1">
        <Link
          to="/"
          data-testid="paywall-back-free"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Back to free recipes
        </Link>
      </div>

      <header className="space-y-3 pt-2">
        <span className="label-tag">PREMIUM</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-4xl sm:text-5xl leading-[0.95]">
          The kitchen <span className="text-brand-primary">levelled up.</span>
        </h1>
        <p className="font-mono text-base text-foreground/80 max-w-xl">
          3-day free trial. After that, A$3.99/mo — or A$24.99 once, forever.
        </p>
      </header>

      {isPremium && (
        <div className="brut-card-yellow p-4 flex items-start gap-3" data-testid="already-premium-banner">
          <Crown size={20} className="text-ink flex-none mt-0.5" />
          <div>
            <div className="font-display font-black uppercase text-sm">You're already in.</div>
            <div className="font-mono text-xs">
              Tier: <strong>{premium?.tier?.toUpperCase()}</strong>
              {isLifetime && " · forever."}
              {isTrial && ` · ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in trial.`}
            </div>
          </div>
        </div>
      )}

      {/* Plan selector */}
      <section data-testid="plan-selector" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="plan-monthly"
            onClick={() => setPkg("monthly")}
            className={`text-left p-5 border-2 transition-colors space-y-2 ${
              pkg === "monthly" ? "border-brand-primary bg-ink" : "border-white/30 hover:border-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-black uppercase text-sm">Monthly</span>
              {pkg === "monthly" && <Check size={18} className="text-brand-primary" />}
            </div>
            <div className="font-display font-black text-3xl">A$3.99<span className="text-foreground/40 text-sm font-mono">/mo</span></div>
            <div className="font-mono text-xs text-foreground/60">3 days free, then A$3.99/mo. Cancel anytime.</div>
          </button>

          <button
            type="button"
            data-testid="plan-lifetime"
            id="lifetime"
            onClick={() => setPkg("lifetime")}
            className={`text-left p-5 border-2 transition-colors space-y-2 relative ${
              pkg === "lifetime" ? "border-brand-primary bg-ink" : "border-white/30 hover:border-white"
            }`}
          >
            <span className="absolute -top-3 left-3 bg-brand-primary text-ink text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border-2 border-ink">Best value</span>
            <div className="flex items-center justify-between">
              <span className="font-display font-black uppercase text-sm">Lifetime</span>
              {pkg === "lifetime" && <Check size={18} className="text-brand-primary" />}
            </div>
            <div className="font-display font-black text-3xl">A$24.99<span className="text-foreground/40 text-sm font-mono">once</span></div>
            <div className="font-mono text-xs text-foreground/60">Pay once. Every feature, every new collection, forever.</div>
          </button>
        </div>

        <button
          type="button"
          data-testid="paywall-checkout-btn"
          onClick={() => handleStart(pkg)}
          disabled={busy}
          className="btn-arcade w-full text-base sm:text-lg"
        >
          <Sparkles size={20} />
          {busy ? "Opening checkout…" : pkg === "lifetime" ? "Get Lifetime — A$24.99" : "Start 3-Day Free Trial"}
        </button>
        {busy && (
          <button
            type="button"
            data-testid="paywall-cancel-busy"
            onClick={() => setBusy(false)}
            className="w-full py-2 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
          >
            Cancel
          </button>
        )}
        {err && (
          <div className="border-2 border-brand-danger p-3 flex items-start gap-2 text-brand-danger font-mono text-xs" data-testid="paywall-error">
            <AlertTriangle size={14} className="mt-0.5" /> {err}
          </div>
        )}
        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 text-center">
          Secure checkout via Stripe · No data sold · Cancel from settings
        </div>
      </section>

      {/* Perks */}
      <section data-testid="perks-section" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">What you get</h2>
        <ul className="space-y-2">
          {PERKS.map((p, i) => (
            <li key={i} className="flex items-start gap-3 border-2 border-white/30 p-3 font-mono text-sm" data-testid={`perk-${i}`}>
              <Check size={16} className="text-brand-primary flex-none mt-0.5" /> {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Parent psychology */}
      <section data-testid="parent-psych-section" className="brut-card-yellow p-5 space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-widest">For parents</span>
        <h2 className="font-display font-black uppercase text-xl text-ink">A confident, fed teen.</h2>
        <p className="font-mono text-sm text-ink">
          Less than the price of one takeaway a month. Built for first flats, exam weeks, and "I'm starving" texts at 11pm. We hand your teen real skills — calmly, visually, without shouting.
        </p>
      </section>

      {/* Collection peek */}
      <section data-testid="collections-peek" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Inside the kitchen</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COLLECTIONS.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              to={`/collections/${c.slug}`}
              data-testid={`collection-peek-${c.slug}`}
              className="border-2 border-white/40 p-3 hover:border-brand-primary transition-colors"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: c.color }}>{c.badge}</div>
              <div className="font-display font-bold uppercase text-sm mt-1">{c.title}</div>
            </Link>
          ))}
        </div>
        <Link to="/collections" data-testid="all-collections-link" className="font-mono text-xs uppercase tracking-widest text-brand-primary hover:underline">
          See all 10 →
        </Link>
      </section>

      <section data-testid="trust-section" className="space-y-3 pb-4">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Why parents like this</h2>
        <ul className="space-y-2 font-mono text-sm text-foreground/80">
          <li className="border-l-2 border-brand-primary pl-3">Built and hosted in Australia — ABN 82 097 590 964, registered to Queensland.</li>
          <li className="border-l-2 border-brand-primary pl-3">No ads. No data sold. <Link to="/privacy" className="text-brand-primary underline">Privacy Act-compliant</Link> with full disclosure of every processor.</li>
          <li className="border-l-2 border-brand-primary pl-3">3-day free trial, no card required. Cancel anytime in one tap.</li>
          <li className="border-l-2 border-brand-primary pl-3">Real human support — <Link to="/support" className="text-brand-primary underline">john.create@protonmail.com</Link>.</li>
        </ul>
      </section>
    </div>
  );
}
