import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Star, Clock } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { getCollection } from "../data/collections";
import { PremiumGate } from "../components/PremiumGate";
import { usePremium } from "../context/PremiumContext";

export default function CollectionDetail() {
  const { slug } = useParams();
  const collection = getCollection(slug);
  const { savedSlugs, toggleSaved } = usePremium();

  if (!collection) return <Navigate to="/collections" replace />;

  return (
    <div data-testid={`collection-detail-${collection.slug}`} className="space-y-6">
      <SeoHead
        title={`${collection.title} — Cheese on Toast`}
        description={collection.tagline}
        canonicalPath={`/collections/${collection.slug}`}
      />

      <Link to="/collections" data-testid="back-collections-link" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary">
        <ArrowLeft size={14} /> All collections
      </Link>

      <header className="space-y-3">
        <span className="label-tag" style={{ color: collection.color, borderColor: collection.color }}>{collection.badge}</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          {collection.title}
        </h1>
        <p className="font-mono text-base text-foreground/80">{collection.tagline}</p>
        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          {collection.positioning}
        </div>
      </header>

      <PremiumGate
        title={`Unlock ${collection.title}`}
        description="Start your 3-day free trial to open every collection."
      >
        <section data-testid="collection-recipes" className="space-y-3">
          {collection.recipes.map((r) => {
            const id = `${collection.slug}/${r.slug}`;
            const saved = savedSlugs.includes(id);
            return (
              <article key={r.slug} className="brut-card p-5 space-y-2" data-testid={`recipe-${r.slug}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold uppercase tracking-tight text-lg">{r.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/50 mt-1">
                      <Clock size={12} /> {r.time}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={`save-toggle-${r.slug}`}
                    onClick={() => toggleSaved(id)}
                    className={`p-2 border-2 transition-colors ${saved ? "border-brand-primary text-brand-primary" : "border-white/30 text-foreground/50 hover:text-foreground"}`}
                    aria-label={saved ? "Unsave" : "Save"}
                  >
                    <Star size={16} fill={saved ? "#FACC15" : "none"} />
                  </button>
                </div>
                <p className="font-mono text-sm text-foreground/85">{r.body}</p>
              </article>
            );
          })}
        </section>
      </PremiumGate>
    </div>
  );
}
