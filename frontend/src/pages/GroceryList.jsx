import { useEffect, useState } from "react";
import { SeoHead } from "../components/SeoHead";
import { PremiumGate } from "../components/PremiumGate";
import { Plus, Trash2, ShoppingCart, Share2 } from "lucide-react";
import { track } from "../lib/analytics";

const KEY = "cot.grocery.v1";
const DEFAULTS = [
  { id: "pasta", text: "Pasta", checked: false, aisle: "Cupboard" },
  { id: "tomatoes", text: "Tin chopped tomatoes", checked: false, aisle: "Cupboard" },
  { id: "eggs", text: "Eggs (6)", checked: false, aisle: "Fresh" },
  { id: "cheese", text: "Cheese", checked: false, aisle: "Fresh" },
  { id: "bread", text: "Bread", checked: false, aisle: "Bakery" },
  { id: "beans", text: "Tin baked beans", checked: false, aisle: "Cupboard" },
];

export default function GroceryList() {
  const [items, setItems] = useState(DEFAULTS);
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const persist = (next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const toggle = (id) => persist(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const remove = (id) => persist(items.filter((i) => i.id !== id));
  const add = () => {
    const t = input.trim();
    if (!t) return;
    persist([...items, { id: `${Date.now()}`, text: t, checked: false, aisle: "Other" }]);
    setInput("");
  };

  const groups = items.reduce((acc, i) => {
    acc[i.aisle] = acc[i.aisle] || [];
    acc[i.aisle].push(i);
    return acc;
  }, {});

  const shareList = async () => {
    track("grocery_share_clicked");
    const text = items.filter((i) => !i.checked).map((i) => `• ${i.text}`).join("\n");
    const message = `My grocery list — Cheese on Toast:\n\n${text}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Grocery list", text: message });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      }
    } catch { /* noop */ }
  };

  return (
    <div data-testid="grocery-page" className="space-y-6">
      <SeoHead
        title="Grocery List — Cheese on Toast Premium"
        description="Smart shopping list grouped by aisle. Share to your phone before you go to the shop."
        canonicalPath="/grocery-list"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">PREMIUM · GROCERY</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Grocery List
        </h1>
        <p className="font-mono text-sm text-foreground/70">Tap to tick. Sorted by aisle. Send to your phone before you leave.</p>
      </header>

      <PremiumGate title="Smart Grocery List" description="Premium feature — auto-syncs with your meal plan.">
        <div className="brut-card p-3 flex gap-2" data-testid="grocery-add-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add item..."
            data-testid="grocery-input"
            className="flex-1 bg-ink border-2 border-white/30 p-2 font-mono text-sm focus:border-brand-primary outline-none"
          />
          <button type="button" data-testid="grocery-add" onClick={add} className="btn-arcade px-3 py-2">
            <Plus size={16} />
          </button>
        </div>

        <section data-testid="grocery-groups" className="space-y-4">
          {Object.entries(groups).map(([aisle, list]) => (
            <div key={aisle} className="space-y-2" data-testid={`aisle-${aisle.toLowerCase()}`}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">{aisle}</div>
              {list.map((it) => (
                <div
                  key={it.id}
                  className={`flex items-center gap-3 border-2 p-3 transition-colors ${
                    it.checked ? "border-brand-primary/40 bg-brand-primary/10" : "border-white/20"
                  }`}
                  data-testid={`grocery-item-${it.id}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={`w-5 h-5 border-2 flex items-center justify-center ${
                      it.checked ? "bg-brand-primary border-brand-primary" : "border-white/60"
                    }`}
                    aria-label={it.checked ? "Untick" : "Tick"}
                  />
                  <span className={`flex-1 font-mono text-sm ${it.checked ? "line-through text-foreground/40" : ""}`}>{it.text}</span>
                  <button type="button" onClick={() => remove(it.id)} className="text-foreground/40 hover:text-brand-danger" aria-label="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>

        <button type="button" data-testid="grocery-share" onClick={shareList} className="btn-arcade w-full">
          <Share2 size={18} /> Send To Phone
        </button>

        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 text-center inline-flex items-center gap-2 justify-center w-full">
          <ShoppingCart size={12} /> {items.filter((i) => !i.checked).length} to buy · {items.filter((i) => i.checked).length} done
        </div>
      </PremiumGate>
    </div>
  );
}
