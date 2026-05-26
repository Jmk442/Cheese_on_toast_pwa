import { Link } from "react-router-dom";
import { SeoHead } from "../components/SeoHead";
import { PremiumGate } from "../components/PremiumGate";
import { Bookmark, ArrowRight } from "lucide-react";
import { usePremium } from "../context/PremiumContext";
import { COLLECTIONS } from "../data/collections";

export default function SavedRecipes() {
  const { savedSlugs } = usePremium();

  const flatRecipes = COLLECTIONS.flatMap((c) =>
    c.recipes.map((r) => ({ ...r, collectionSlug: c.slug, collectionTitle: c.shortTitle || c.title, color: c.color, id: `${c.slug}/${r.slug}` }))
  );
  const saved = flatRecipes.filter((r) => savedSlugs.includes(r.id));

  return (
    <div data-testid="saved-page" className="space-y-6">
      <SeoHead
        title="Saved Recipes (Offline) — Cheese on Toast"
        description="Your starred recipes, available offline."
        canonicalPath="/saved"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">PREMIUM · OFFLINE</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Saved & Offline
        </h1>
        <p className="font-mono text-sm text-foreground/70">Star a recipe — it's stored on your device for no-signal moments.</p>
      </header>

      <PremiumGate title="Offline Saved Recipes" description="Premium feature — star up to 50 recipes for offline cooking.">
        {saved.length === 0 ? (
          <div className="brut-card p-6 text-center space-y-3" data-testid="saved-empty">
            <Bookmark size={28} className="mx-auto text-foreground/40" />
            <div className="font-display font-black uppercase text-base">Nothing saved yet</div>
            <p className="font-mono text-xs text-foreground/60">Open a collection and tap the star on any recipe.</p>
            <Link to="/collections" data-testid="saved-cta-collections" className="btn-arcade inline-flex">
              Browse collections <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3" data-testid="saved-list">
            {saved.map((r) => (
              <li key={r.id} data-testid={`saved-item-${r.slug}`}>
                <Link to={`/collections/${r.collectionSlug}`} className="brut-card p-4 block space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: r.color }}>{r.collectionTitle}</div>
                  <div className="font-display font-bold uppercase tracking-tight text-base">{r.title}</div>
                  <div className="font-mono text-xs text-foreground/70">{r.body}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PremiumGate>
    </div>
  );
}
