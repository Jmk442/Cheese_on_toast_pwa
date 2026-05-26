import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Clock, ChefHat, AlertTriangle, ArrowLeft, Zap, Check } from "lucide-react";
import { getRecipe } from "../data/recipes";
import { SeoHead, buildRecipeJsonLd } from "../components/SeoHead";

export default function RecipeDetail() {
  const { slug } = useParams();
  const recipe = getRecipe(slug);
  const [checked, setChecked] = useState({});

  if (!recipe) return <Navigate to="/" replace />;

  const toggle = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));

  return (
    <article data-testid={`recipe-page-${recipe.slug}`} className="space-y-8">
      <SeoHead
        title={`${recipe.title} — Step by Step Recipe`}
        description={`${recipe.title}. ${recipe.tagline} Ingredients, tools and step-by-step instructions for teens.`}
        canonicalPath={`/recipe/${recipe.slug}`}
        jsonLd={buildRecipeJsonLd(recipe)}
      />

      <div className="pt-1">
        <Link
          to="/"
          data-testid="back-home-link"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Back to recipes
        </Link>
      </div>

      <header className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-tag">{recipe.difficulty}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/60 inline-flex items-center gap-1">
            <Clock size={12} /> {recipe.time}
          </span>
        </div>
        <h1 className="font-display font-black uppercase tracking-tighter text-4xl sm:text-5xl leading-[0.95]">
          {recipe.title}
        </h1>
        <p className="font-mono text-base text-foreground/80 max-w-xl">{recipe.tagline}</p>

        <div className="overflow-hidden border-2 border-white/90 bg-ink">
          <img src={recipe.image} alt={recipe.title} className="w-full h-56 sm:h-72 object-cover" />
        </div>

        {recipe.simulatorPath && (
          <Link to={recipe.simulatorPath} data-testid="open-sandbox-from-recipe" className="btn-arcade w-full sm:w-auto">
            <Zap size={18} /> Practice in the Sandbox
          </Link>
        )}
      </header>

      {/* INGREDIENTS */}
      <section data-testid="ingredients-section" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-2xl">Ingredients</h2>
        <ul className="space-y-2 font-mono">
          {recipe.ingredients.map((it, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(`i-${i}`)}
                data-testid={`ingredient-${i}`}
                className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-colors ${
                  checked[`i-${i}`]
                    ? "border-brand-primary bg-brand-primary/10 line-through text-foreground/50"
                    : "border-white/20 hover:border-white"
                }`}
              >
                <span className={`mt-0.5 w-5 h-5 border-2 flex items-center justify-center flex-none ${
                  checked[`i-${i}`] ? "border-brand-primary bg-brand-primary text-ink" : "border-white/60"
                }`}>
                  {checked[`i-${i}`] && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="text-sm sm:text-base">{it}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* TOOLS */}
      <section data-testid="tools-section" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-2xl">Tools</h2>
        <div className="flex flex-wrap gap-2">
          {recipe.tools.map((t, i) => (
            <span
              key={i}
              data-testid={`tool-${i}`}
              className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest px-3 py-2 border-2 border-white/60"
            >
              <ChefHat size={12} /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section data-testid="steps-section" className="space-y-4">
        <h2 className="font-display font-black uppercase tracking-tight text-2xl">Steps</h2>
        <ol className="space-y-4">
          {recipe.steps.map((s, i) => (
            <li
              key={i}
              data-testid={`step-${i}`}
              className="brut-card p-4 sm:p-5 flex gap-4"
            >
              <span className="flex-none w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary text-ink border-2 border-white font-display font-black text-xl flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1">
                <h3 className="font-display font-bold uppercase tracking-tight text-base sm:text-lg">
                  {s.title}
                </h3>
                <p className="font-mono text-sm text-foreground/80">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* WARNINGS */}
      <section data-testid="warnings-section" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-2xl text-brand-danger">
          What Could Go Wrong
        </h2>
        <ul className="space-y-2">
          {recipe.warnings.map((w, i) => (
            <li
              key={i}
              data-testid={`warning-${i}`}
              className="flex items-start gap-3 border-2 border-brand-danger bg-ink p-3"
            >
              <AlertTriangle size={18} className="text-brand-danger flex-none mt-0.5" />
              <span className="font-mono text-sm text-foreground/90">{w}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
