import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { COLLECTIONS } from "../data/collections";
import { usePremium } from "../context/PremiumContext";

export default function Collections() {
  const { isPremium } = usePremium();

  return (
    <div data-testid="collections-page" className="space-y-6">
      <SeoHead
        title="Recipe Collections — Cheese on Toast Premium"
        description="10 curated collections for teens: moving out, budget meals, air fryer, study snacks, late night, seasonal and more."
        canonicalPath="/collections"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">{isPremium ? "PREMIUM · UNLOCKED" : "PREMIUM"}</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          The 10 Collections
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Curated playlists of recipes for the moments teens actually need them.
        </p>
        {!isPremium && (
          <Link to="/premium" data-testid="collections-paywall-link" className="btn-arcade w-full sm:w-auto inline-flex mt-2">
            Start 3-day free trial
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="collections-grid">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.slug}
            to={`/collections/${c.slug}`}
            data-testid={`collection-card-${c.slug}`}
            className="brut-card p-5 space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: c.color }}>{c.badge}</span>
              {!isPremium && <Lock size={14} className="text-foreground/40" />}
            </div>
            <h2 className="font-display font-black uppercase tracking-tight text-xl">{c.title}</h2>
            <p className="font-mono text-xs text-foreground/70">{c.tagline}</p>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              <span>{c.recipes.length} recipes</span>
              <ArrowRight size={14} className="group-hover:text-brand-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
