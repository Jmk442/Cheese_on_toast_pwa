import { Link } from "react-router-dom";
import { Clock, AlertTriangle } from "lucide-react";
import { RECIPES } from "../data/recipes";
import { SeoHead } from "../components/SeoHead";

export default function RecipeList() {
  return (
    <div data-testid="recipes-list-page" className="space-y-6">
      <SeoHead
        title="Simple Recipes for Teens — Cheese on Toast & More"
        description="Simple step-by-step recipes for teens: cheese on toast, boiled rice, fried rice, sushi hand rolls, and how to heat food without a microwave."
        canonicalPath="/recipes"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">ALL RECIPES</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Simple Recipes
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Things you can actually make. No 30-ingredient nonsense.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" data-testid="recipes-grid-all">
        {RECIPES.map((r) => (
          <Link
            key={r.slug}
            to={`/recipe/${r.slug}`}
            data-testid={`recipe-card-all-${r.slug}`}
            className="brut-card p-0 overflow-hidden block group"
          >
            <div className="h-40 overflow-hidden border-b-2 border-white/90 bg-ink relative">
              <img src={r.image} alt={r.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              {r.flagship && (
                <span className="absolute top-2 left-2 bg-brand-primary text-ink text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-ink">
                  Flagship
                </span>
              )}
              {r.eyesOnIt && (
                <span className="absolute top-2 right-2 bg-brand-danger text-white text-[10px] font-mono uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Eyes on it
                </span>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/60">
                <Clock size={12} /> {r.time}
                <span className="text-foreground/30">·</span>
                <span>{r.difficulty}</span>
              </div>
              <h3 className="font-display font-bold uppercase tracking-tight text-lg leading-tight">
                {r.shortTitle}
              </h3>
              <p className="font-mono text-xs text-foreground/70">{r.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
