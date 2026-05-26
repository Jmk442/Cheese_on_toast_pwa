/**
 * Difficulty picker — shared across all simulators.
 * Pass current value + onChange. Locked when `locked` (e.g. sim running / outcome shown).
 */
export const DifficultyPicker = ({ value, onChange, locked = false }) => {
  const opts = [
    { key: "EASY",   label: "Easy",   tone: "bg-brand-perfect text-ink" },
    { key: "NORMAL", label: "Normal", tone: "bg-brand-primary text-ink" },
    { key: "HARD",   label: "Hard",   tone: "bg-brand-danger text-white" },
  ];
  return (
    <div data-testid="difficulty-picker" className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">Difficulty</span>
        {locked && <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">locked while running</span>}
      </div>
      <div className="flex gap-2">
        {opts.map((o) => (
          <button
            type="button"
            key={o.key}
            data-testid={`diff-${o.key.toLowerCase()}`}
            disabled={locked}
            onClick={() => !locked && onChange(o.key)}
            className={`flex-1 py-3 px-2 border-2 font-display font-bold uppercase text-xs sm:text-sm transition-colors ${
              value === o.key
                ? `${o.tone} border-current`
                : "border-white/30 text-foreground/60 hover:border-white"
            } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/** Multipliers applied per-sim per-difficulty. Each sim picks the keys it needs. */
export const DIFFICULTY_FACTORS = {
  EASY:   { rate: 0.75, perfectWidth: 1.3 },
  NORMAL: { rate: 1.0,  perfectWidth: 1.0 },
  HARD:   { rate: 1.4,  perfectWidth: 0.65 },
};
