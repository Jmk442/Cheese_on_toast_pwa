import { Link } from "react-router-dom";
import { ArrowRight, Clock, Zap, AlertTriangle, Flame } from "lucide-react";
import { RECIPES, ASSETS } from "../data/recipes";
import { SeoHead, buildRecipeJsonLd } from "../components/SeoHead";

export default function Home() {
  const flagship = RECIPES.find((r) => r.flagship);
  const others = RECIPES.filter((r) => !r.flagship);

  return (
    <div data-testid="home-page" className="space-y-10">
      <SeoHead
        title="How to Make Cheese on Toast — Step by Step (Visual Sandbox)"
        description="The foolproof teen guide to cheese on toast. Bread in the toaster, cheese on the toast, then under the grill. Practice in our visual oven sandbox before you cook."
        canonicalPath="/"
        jsonLd={buildRecipeJsonLd(flagship)}
      />

      {/* HERO */}
      <section data-testid="hero" className="space-y-5 pt-2">
        <div className="flex items-center gap-2">
          <span className="label-tag" data-testid="hero-pretag">LEVEL 1 · COOKING 101</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">no microwave required</span>
        </div>

        <h1 className="font-display font-black uppercase tracking-tighter text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
          How to make
          <br />
          <span className="text-brand-primary">Cheese</span> on <span className="underline decoration-brand-primary decoration-[6px] underline-offset-4">Toast</span>
        </h1>

        <p className="text-base sm:text-lg text-foreground/80 max-w-xl font-mono">
          Bread goes in the toaster.{" "}
          <span className="text-brand-primary font-semibold">Toast</span> comes out.
          Cheese goes on the toast. The toast goes under the grill. Don't walk away.
          That's the whole thing.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/simulator" data-testid="cta-sandbox" className="btn-arcade">
            <Zap size={18} /> Try the Oven Sandbox
          </Link>
          <Link to="/recipe/cheese-on-toast" data-testid="cta-read-recipe" className="btn-arcade btn-ghost">
            Read the Recipe <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FLAGSHIP CARD */}
      <section data-testid="flagship-section">
        <div className="brut-card-yellow p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={ASSETS.cheeseToast}
              alt="Golden cheese on toast"
              className="w-full sm:w-56 h-44 sm:h-44 object-cover border-2 border-ink"
              data-testid="flagship-image"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-ink text-brand-primary text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-ink">
                  Flagship
                </span>
                <span className="text-xs font-mono uppercase tracking-widest">5 min · Easy</span>
              </div>
              <h2 className="font-display font-black uppercase tracking-tight text-2xl sm:text-3xl">
                The Real Recipe
              </h2>
              <p className="font-mono text-sm sm:text-base">
                4 steps. 2 ingredients. Stay in the room while the grill is on. We'll walk you through every second.
              </p>
              <Link
                to="/recipe/cheese-on-toast"
                data-testid="flagship-link"
                className="inline-flex items-center gap-2 bg-ink text-brand-primary border-2 border-ink px-4 py-2 font-display font-bold uppercase text-sm hover:bg-foreground hover:text-ink transition-colors"
              >
                Open Recipe <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RECIPES GRID */}
      <section data-testid="recipes-grid-section">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display font-black uppercase tracking-tight text-2xl">More Basics</h2>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
            {others.length} recipes
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" data-testid="recipes-grid">
          {others.map((r) => (
            <Link
              key={r.slug}
              to={`/recipe/${r.slug}`}
              data-testid={`recipe-card-${r.slug}`}
              className="brut-card p-0 overflow-hidden block group"
            >
              <div className="h-40 overflow-hidden border-b-2 border-white/90 bg-ink relative">
                <img
                  src={r.image}
                  alt={r.title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                {r.eyesOnIt && (
                  <span className="absolute top-2 left-2 bg-brand-danger text-white text-[10px] font-mono uppercase tracking-widest px-2 py-1 flex items-center gap-1">
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
      </section>

      {/* WARNING / FOOTER STRIP */}
      <section data-testid="safety-strip">
        <div className="border-2 border-brand-danger p-5 bg-ink">
          <div className="flex items-start gap-3">
            <Flame size={24} className="text-brand-danger flex-none mt-1" />
            <div>
              <h3 className="font-display font-black uppercase tracking-tight text-lg text-brand-danger">
                Rule #1
              </h3>
              <p className="font-mono text-sm text-foreground/80">
                If you turn on the grill or the hob — <span className="text-brand-primary">stay in the kitchen.</span> Phone goes face down. We'll show you what happens if you don't (spoiler: nuclear explosion).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
