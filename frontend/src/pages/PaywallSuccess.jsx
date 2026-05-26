import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Crown, Loader2, Mail } from "lucide-react";
import { usePremium } from "../context/PremiumContext";
import { SeoHead } from "../components/SeoHead";
import { AccountLinkCard } from "../components/AccountLinkCard";
import { getAccountMe } from "../lib/api";
import { getDeviceId } from "../lib/device";
import { track } from "../lib/analytics";

export default function PaywallSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { pollCheckout, refreshPremium, premium } = usePremium();
  const [state, setState] = useState("polling"); // polling | success | timeout
  const [pkg, setPkg] = useState(null);
  const [linked, setLinked] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setState("timeout");
      return;
    }
    track("checkout_redirect_back", { session_id: sessionId });
    pollCheckout(
      sessionId,
      (s) => { setPkg(s.package); setState("success"); refreshPremium(); },
      () => { setState("timeout"); }
    );
  }, [sessionId, pollCheckout, refreshPremium]);

  // After success — check link status so we can show or hide the link CTA
  useEffect(() => {
    if (state !== "success") return;
    getAccountMe(getDeviceId()).then((a) => setLinked(!!a?.linked)).catch(() => setLinked(false));
  }, [state]);

  return (
    <div data-testid="paywall-success" className="space-y-6 pt-4">
      <SeoHead
        title="Welcome to Premium — Cheese on Toast"
        description="Your premium kitchen is unlocked."
        canonicalPath="/premium/success"
      />

      {state === "polling" && (
        <div className="brut-card p-8 text-center space-y-3" data-testid="success-polling">
          <Loader2 size={36} className="animate-spin mx-auto text-brand-primary" />
          <div className="font-display font-black uppercase text-lg">Confirming your purchase...</div>
          <div className="font-mono text-xs text-foreground/60">This usually takes a few seconds.</div>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-5" data-testid="success-confirmed">
          <div className="brut-card-yellow p-6 space-y-3 text-ink">
            <Crown size={28} />
            <div className="font-display font-black uppercase text-3xl leading-tight">You're in.</div>
            <div className="font-mono text-sm">
              {pkg === "lifetime"
                ? "Lifetime premium unlocked. Every collection, every future feature, forever."
                : premium?.tier === "trial"
                  ? "Trial active. We'll only charge after day 3 — cancel anytime in settings."
                  : "Premium active for 30 days."}
            </div>
          </div>

          {/* Auto-link prompt — the highest-conversion moment for protecting their purchase */}
          {linked === false && (
            <div className="brut-card p-5 space-y-4 border-brand-primary" data-testid="post-purchase-link-prompt">
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-brand-primary" />
                <span className="label-tag">PROTECT YOUR PURCHASE</span>
              </div>
              <h2 className="font-display font-black uppercase tracking-tight text-xl">
                Sync premium to all your devices.
              </h2>
              <p className="font-mono text-sm text-foreground/80">
                Right now your premium is tied to <strong>this device only</strong>. Link your email so it follows you to your phone, tablet & laptop — and stays safe if you clear browser data.
              </p>
              <AccountLinkCard hideHeader compact />
            </div>
          )}

          <div className="space-y-3">
            <Link to="/collections" data-testid="success-collections" className="btn-arcade w-full">
              <Check size={18} /> Explore the 10 Collections
            </Link>
            <Link to="/meal-plan" data-testid="success-mealplan" className="btn-arcade btn-ghost w-full">
              Start a meal plan
            </Link>
          </div>
        </div>
      )}

      {state === "timeout" && (
        <div className="brut-card p-6 space-y-3" data-testid="success-timeout">
          <div className="font-display font-black uppercase text-xl">Couldn't confirm yet</div>
          <div className="font-mono text-sm text-foreground/70">
            Your payment may still be processing. We'll update premium automatically once Stripe confirms — usually within a minute.
          </div>
          <Link to="/" className="btn-arcade w-full">Back to Home</Link>
        </div>
      )}
    </div>
  );
}
