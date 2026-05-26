import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, X, Crown } from "lucide-react";
import { usePremium } from "../context/PremiumContext";
import { track } from "../lib/analytics";

const DISMISSED_KEY = "cot.paywall_dismissed.v1";
const FIRST_LAUNCH_SHOWN = "cot.first_launch_paywall.v1";
const INT_SHOWN_KEY = "cot.interruption_shown.v1";
const ACH_SHOWN_KEY = "cot.ach_paywall_shown.v1";

const getDismissed = () => {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}"); }
  catch { return {}; }
};
const setDismissed = (k) => {
  try {
    const all = getDismissed();
    all[k] = Date.now();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(all));
  } catch { /* noop */ }
};
const wasDismissed = (k, withinHours = 24) => {
  const all = getDismissed();
  const t = all[k];
  if (!t) return false;
  return (Date.now() - t) < withinHours * 3600 * 1000;
};

/**
 * Global paywall trigger. Renders a full-screen modal in several scenarios:
 *  - first launch (after 25s) for new free users (i.e. not premium beyond trial)
 *  - interruption: after 3 sim runs in a session
 *  - achievement unlock: when localStorage 'cot.stats.v1' unlocks third+ badge
 *  - lifetime upsell: every Nth visit to /premium
 *
 * Free users in trial get gentler nudges; expired-trial users get harder ones.
 */
export const PaywallTrigger = () => {
  const { isPremium, isTrial, isLifetime, trialDaysLeft, premium } = usePremium();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState("first-launch");

  // Don't trigger anything on the paywall pages themselves
  const isOnPaywall = loc.pathname.startsWith("/premium");

  // Trigger 1: first launch
  useEffect(() => {
    if (isOnPaywall || isLifetime) return;
    try {
      if (localStorage.getItem(FIRST_LAUNCH_SHOWN)) return;
    } catch { return; }
    const t = setTimeout(() => {
      if (wasDismissed("first-launch", 24)) return;
      setVariant("first-launch");
      setOpen(true);
      try { localStorage.setItem(FIRST_LAUNCH_SHOWN, "1"); } catch { /* noop */ }
      track("paywall_shown", { kind: "first-launch", is_trial: isTrial });
    }, 25000);
    return () => clearTimeout(t);
  }, [isOnPaywall, isLifetime, isTrial]);

  // Trigger 2: interruption after 3 sim runs
  useEffect(() => {
    if (isOnPaywall || isLifetime || isPremium && !isTrial) return;
    const check = () => {
      try {
        const s = JSON.parse(localStorage.getItem("cot.stats.v1") || "{}");
        const plays = (s.cheese?.plays || 0) + (s.rice?.plays || 0) + (s.pan?.plays || 0);
        const shown = parseInt(localStorage.getItem(INT_SHOWN_KEY) || "0", 10);
        if (plays >= 3 && plays > shown && !wasDismissed("interruption", 6)) {
          setVariant("interruption");
          setOpen(true);
          localStorage.setItem(INT_SHOWN_KEY, String(plays));
          track("paywall_shown", { kind: "interruption", plays });
        }
      } catch { /* noop */ }
    };
    const interval = setInterval(check, 2500);
    return () => clearInterval(interval);
  }, [isOnPaywall, isLifetime, isPremium, isTrial]);

  // Trigger 3: achievement unlock — when 3rd+ badge unlocks
  useEffect(() => {
    if (isOnPaywall || isLifetime) return;
    const check = () => {
      try {
        const s = JSON.parse(localStorage.getItem("cot.stats.v1") || "{}");
        const count = (s.unlocked || []).length;
        const shown = parseInt(localStorage.getItem(ACH_SHOWN_KEY) || "0", 10);
        if (count >= 3 && count > shown && !wasDismissed("achievement", 12)) {
          setVariant("achievement");
          setOpen(true);
          localStorage.setItem(ACH_SHOWN_KEY, String(count));
          track("paywall_shown", { kind: "achievement", badge_count: count });
        }
      } catch { /* noop */ }
    };
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [isOnPaywall, isLifetime]);

  if (!open) return null;

  const onDismiss = () => {
    setOpen(false);
    setDismissed(variant);
    track("paywall_dismissed", { kind: variant });
  };

  const COPY = {
    "first-launch": {
      pre: "MEET THE PREMIUM KITCHEN",
      headline: "Everything to actually feed your teen.",
      sub: "Moving-out survival, budget meals, air-fryer recipes, meal plans + grocery lists. 3 days free.",
    },
    "interruption": {
      pre: "ENJOYING THE SANDBOX?",
      headline: "Unlock the real toolkit.",
      sub: "10 collections, weekly meal plans, kitchen cosmetics + offline. Start a 3-day free trial — cancel anytime.",
    },
    "achievement": {
      pre: "YOU'RE GOOD AT THIS",
      headline: "Premium badges await.",
      sub: "6 premium achievements + advanced collections + cosmetics. Free for 3 days.",
    },
  }[variant];

  return (
    <div
      data-testid={`paywall-modal-${variant}`}
      role="dialog"
      className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-rise"
    >
      <div className="brut-card max-w-md w-full p-6 space-y-5 relative">
        <button
          type="button"
          aria-label="Close"
          data-testid="paywall-close"
          onClick={onDismiss}
          className="absolute top-3 right-3 inline-flex w-9 h-9 items-center justify-center border-2 border-white/40 text-foreground/70 hover:border-brand-primary hover:text-brand-primary"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex w-9 h-9 items-center justify-center bg-brand-primary text-ink border-2 border-white">
            <Crown size={16} strokeWidth={2.5} />
          </span>
          <span className="label-tag">{COPY.pre}</span>
        </div>

        <h2 className="font-display font-black uppercase tracking-tight text-2xl leading-tight">
          {COPY.headline}
        </h2>
        <p className="font-mono text-sm text-foreground/80">{COPY.sub}</p>

        <div className="border-2 border-brand-primary/60 p-3 bg-ink/60 space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-brand-primary">For parents</div>
          <p className="font-mono text-xs text-foreground/80">A confident, fed teen for less than the cost of one takeaway a month. A$3.99/mo or one-time A$24.99 forever.</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Link
            to="/premium"
            data-testid="paywall-cta-trial"
            onClick={() => track("paywall_cta_click", { kind: variant, target: "trial" })}
            className="btn-arcade w-full"
          >
            <Sparkles size={18} /> Start 3-Day Free Trial
          </Link>
          <Link
            to="/premium#lifetime"
            data-testid="paywall-cta-lifetime"
            onClick={() => track("paywall_cta_click", { kind: variant, target: "lifetime" })}
            className="btn-arcade btn-ghost w-full"
          >
            See Lifetime (A$24.99)
          </Link>
          <button
            type="button"
            data-testid="paywall-skip"
            onClick={onDismiss}
            className="text-[11px] font-mono uppercase tracking-widest text-foreground/50 hover:text-foreground py-2"
          >
            Maybe later
          </button>
        </div>

        {isTrial && trialDaysLeft !== null && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-brand-primary text-center">
            Your trial: {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
          </div>
        )}
      </div>
    </div>
  );
};
