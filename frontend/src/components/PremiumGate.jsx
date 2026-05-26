import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "../context/PremiumContext";

/**
 * Wraps premium-only content. If premium → renders children.
 * If not premium → renders a teaser with locked overlay + paywall CTA.
 *
 * Props:
 *   title: what is locked
 *   description: short copy
 *   teaser: optional preview rendered behind the blur
 */
export const PremiumGate = ({ title = "Premium feature", description, teaser, children }) => {
  const { isPremium } = usePremium();
  if (isPremium) return <>{children}</>;

  return (
    <div data-testid="premium-gate" className="relative">
      {teaser && (
        <div aria-hidden className="pointer-events-none blur-sm opacity-50 select-none">
          {teaser}
        </div>
      )}
      <div className="brut-card p-6 space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center bg-brand-primary text-ink border-2 border-white">
            <Lock size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display font-black uppercase text-base sm:text-lg tracking-tight">{title}</span>
        </div>
        {description && (
          <p className="font-mono text-sm text-foreground/80">{description}</p>
        )}
        <div className="grid grid-cols-1 gap-2">
          <Link to="/premium" data-testid="gate-paywall-link" className="btn-arcade w-full">
            <Sparkles size={18} /> Unlock Premium
          </Link>
          <Link to="/premium" data-testid="gate-trial-link" className="btn-arcade btn-ghost w-full">
            Start 3-day free trial
          </Link>
        </div>
      </div>
    </div>
  );
};
