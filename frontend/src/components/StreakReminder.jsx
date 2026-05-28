import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, X, ArrowRight } from "lucide-react";
import { getStats } from "../lib/achievements";
import { track } from "../lib/analytics";

const STORAGE_KEY = "cot.streak_reminder.v1";
const REMIND_AFTER_DAYS = 3;

const SIM_LABELS = {
  cheese: { name: "Cheese on Toast", path: "/simulator" },
  rice:   { name: "Boiled Rice",     path: "/simulator/boiled-rice" },
  pan:    { name: "Saucepan",        path: "/simulator/saucepan-heating" },
};

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastShown: 0, lastDismissed: 0 };
    return JSON.parse(raw);
  } catch { return { lastShown: 0, lastDismissed: 0 }; }
};

const writeState = (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
};

const daysSince = (ts) => (ts ? (Date.now() - ts) / (1000 * 60 * 60 * 24) : Infinity);

/**
 * StreakReminder
 *  – Shows a banner on Home if:
 *      • the user has a current streak ≥1 in at least one sim,
 *      • AND ≥ REMIND_AFTER_DAYS days have passed since we last reminded them.
 *  – Once dismissed, the timer resets (we won't nag again for another 3 days).
 *  – Once the user clicks "Resume", same — we mark it shown.
 *
 * Persistence: localStorage cot.streak_reminder.v1 = { lastShown, lastDismissed }
 */
export const StreakReminder = () => {
  const [visible, setVisible] = useState(false);
  const [topSim, setTopSim] = useState(null); // { key, current, best }

  useEffect(() => {
    const stats = getStats();
    // Find the sim with the highest current streak (≥1)
    const candidates = ["cheese", "rice", "pan"]
      .map((k) => ({ key: k, current: stats[k]?.currentStreak || 0, best: stats[k]?.bestStreak || 0 }))
      .filter((c) => c.current >= 1)
      .sort((a, b) => b.current - a.current);

    if (candidates.length === 0) return;

    const state = readState();
    const lastActivity = Math.max(state.lastShown || 0, state.lastDismissed || 0);
    if (daysSince(lastActivity) < REMIND_AFTER_DAYS) return;

    setTopSim(candidates[0]);
    setVisible(true);
    writeState({ ...state, lastShown: Date.now() });
    track("streak_reminder_shown", { sim: candidates[0].key, current: candidates[0].current });
  }, []);

  if (!visible || !topSim) return null;

  const sim = SIM_LABELS[topSim.key];
  const onDismiss = () => {
    setVisible(false);
    writeState({ ...readState(), lastDismissed: Date.now() });
    track("streak_reminder_dismissed", { sim: topSim.key });
  };

  return (
    <div
      data-testid="streak-reminder"
      data-sim={topSim.key}
      className="brut-card p-4 sm:p-5 relative animate-rise border-brand-danger"
    >
      <button
        type="button"
        data-testid="streak-reminder-close"
        aria-label="Dismiss streak reminder"
        onClick={onDismiss}
        className="absolute top-2 right-2 inline-flex w-8 h-8 items-center justify-center text-foreground/60 hover:text-brand-primary border-2 border-transparent hover:border-brand-primary/40"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="inline-flex w-10 h-10 flex-none items-center justify-center bg-brand-danger text-white border-2 border-white">
          <Flame size={18} strokeWidth={2.5} />
        </span>
        <div className="flex-1 space-y-2">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-brand-danger">Your streak is waiting</div>
            <div className="font-display font-black uppercase text-base sm:text-lg leading-tight">
              {topSim.current}-perfect streak on {sim.name}
            </div>
          </div>
          <p className="font-mono text-xs text-foreground/80">
            It's been a few days. One more perfect run keeps it alive — break the streak and you start over.
            {topSim.best > topSim.current && ` Your best is ${topSim.best}.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              to={sim.path}
              data-testid="streak-reminder-cta"
              onClick={() => track("streak_reminder_cta_click", { sim: topSim.key })}
              className="btn-arcade inline-flex text-xs"
            >
              Resume <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              data-testid="streak-reminder-skip"
              onClick={onDismiss}
              className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 hover:text-foreground px-2 py-1"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
