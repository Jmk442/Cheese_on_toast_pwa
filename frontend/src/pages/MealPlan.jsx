import { useEffect, useState } from "react";
import { SeoHead } from "../components/SeoHead";
import { PremiumGate } from "../components/PremiumGate";
import { ChefHat, Save, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "../lib/analytics";

const DEFAULTS = {
  Mon: "Cheese on toast + soup",
  Tue: "One-pan mince + rice",
  Wed: "Beans on toast + egg",
  Thu: "Air fryer chicken thighs + fries",
  Fri: "Tuna pasta",
  Sat: "Stir fry",
  Sun: "Roast chicken (extras for Mon)",
};
const KEY = "cot.mealplan.v1";

export default function MealPlan() {
  const [plan, setPlan] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlan(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const update = (day, value) => setPlan((p) => ({ ...p, [day]: value }));

  const onSave = () => {
    try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch { /* noop */ }
    setSaved(true);
    track("meal_plan_saved", { day_count: Object.keys(plan).length });
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div data-testid="mealplan-page" className="space-y-6">
      <SeoHead
        title="Weekly Meal Plan — Cheese on Toast Premium"
        description="Plan a week of dinners. Auto-generates your grocery list."
        canonicalPath="/meal-plan"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">PREMIUM · MEAL PLAN</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          This Week's Plan
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          5 dinners. 1 shop. 0 "what's for tea" arguments.
        </p>
      </header>

      <PremiumGate
        title="Weekly Meal Plan"
        description="Plan a week of dinners and auto-generate your shopping list. Premium feature."
      >
        <section data-testid="mealplan-grid" className="space-y-2">
          {Object.entries(plan).map(([day, value]) => (
            <div key={day} className="brut-card p-4 space-y-2" data-testid={`mealplan-${day}`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-black uppercase text-sm">{day}</span>
                <ChefHat size={14} className="text-foreground/40" />
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => update(day, e.target.value)}
                data-testid={`mealplan-input-${day}`}
                className="w-full bg-ink border-2 border-white/30 p-2 font-mono text-sm focus:border-brand-primary outline-none"
              />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" data-testid="mealplan-save" onClick={onSave} className="btn-arcade">
            <Save size={18} /> {saved ? "Saved ✓" : "Save Week"}
          </button>
          <Link to="/grocery-list" data-testid="mealplan-to-grocery" className="btn-arcade btn-ghost">
            <ShoppingCart size={18} /> Generate Grocery List
          </Link>
        </div>
      </PremiumGate>
    </div>
  );
}
