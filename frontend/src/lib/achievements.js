// Persistent achievements — localStorage based, framework-free.
//
// Stats shape:
// {
//   cheese: { plays, perfects, fires, nukes, hardPerfects, currentStreak, bestStreak },
//   rice:   { plays, perfects, scorches, disasters, hardPerfects, currentStreak, bestStreak },
//   pan:    { plays, perfects, burns, scorches, hardPerfects, currentStreak, bestStreak },
//   unlocked: [ "first-toast", ... ]
// }
//
// "Streak" = consecutive PERFECT outcomes in the same simulator. Any other
// outcome (including a reset before finishing) resets currentStreak to 0.
// bestStreak only goes up.

const STORAGE_KEY = "cot.stats.v1";

const EMPTY_SIM = () => ({
  plays: 0,
  perfects: 0,
  hardPerfects: 0,
  currentStreak: 0,
  bestStreak: 0,
});

const EMPTY = () => ({
  cheese: { ...EMPTY_SIM(), fires: 0, nukes: 0 },
  rice:   { ...EMPTY_SIM(), scorches: 0, disasters: 0 },
  pan:    { ...EMPTY_SIM(), burns: 0, scorches: 0 },
  unlocked: [],
});

export const BADGES = [
  {
    id: "first-toast",
    name: "First Perfect Toast",
    description: "Get a PERFECT outcome on the cheese-on-toast sim.",
    icon: "Trophy",
    check: (s) => s.cheese.perfects >= 1,
  },
  {
    id: "golden-master",
    name: "Golden Master",
    description: "Three perfect cheese-on-toasts. A true grill-watcher.",
    icon: "Crown",
    check: (s) => s.cheese.perfects >= 3,
  },
  {
    id: "rice-rookie",
    name: "Rice Rookie",
    description: "Boil rice without burning the pan. Once.",
    icon: "ChefHat",
    check: (s) => s.rice.perfects >= 1,
  },
  {
    id: "rice-pro",
    name: "Rice Pro",
    description: "Three perfect pans of rice. The lid stays on.",
    icon: "Award",
    check: (s) => s.rice.perfects >= 3,
  },
  {
    id: "stir-pro",
    name: "Stir Pro",
    description: "Heat food in a saucepan without burning the bottom.",
    icon: "UtensilsCrossed",
    check: (s) => s.pan.perfects >= 1,
  },
  {
    id: "chaos",
    name: "Chaos Merchant",
    description: "Cause a nuclear, disaster or scorched outcome. We see you.",
    icon: "Flame",
    check: (s) => (s.cheese.nukes + s.rice.disasters + s.pan.scorches) >= 1,
  },
  {
    id: "tour",
    name: "Sandbox Tour",
    description: "Play all three simulators at least once.",
    icon: "Gamepad2",
    check: (s) => s.cheese.plays >= 1 && s.rice.plays >= 1 && s.pan.plays >= 1,
  },
  {
    id: "iron-chef",
    name: "Iron Chef",
    description: "Three perfects on HARD difficulty across the sims.",
    icon: "Swords",
    check: (s) => (s.cheese.hardPerfects + s.rice.hardPerfects + s.pan.hardPerfects) >= 3,
  },
  // ---- Streak badges (any sim) ----
  {
    id: "streak-3",
    name: "Hot Streak",
    description: "Three perfect runs in a row in any single sim.",
    icon: "Zap",
    check: (s) => Math.max(s.cheese.bestStreak || 0, s.rice.bestStreak || 0, s.pan.bestStreak || 0) >= 3,
  },
  {
    id: "streak-5",
    name: "On Fire",
    description: "Five perfect runs in a row in any single sim.",
    icon: "Flame",
    check: (s) => Math.max(s.cheese.bestStreak || 0, s.rice.bestStreak || 0, s.pan.bestStreak || 0) >= 5,
  },
  {
    id: "streak-10",
    name: "Unbreakable",
    description: "Ten perfect runs in a row in any single sim. Unhinged behaviour.",
    icon: "Sparkles",
    check: (s) => Math.max(s.cheese.bestStreak || 0, s.rice.bestStreak || 0, s.pan.bestStreak || 0) >= 10,
  },
];

export const getStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY();
    const parsed = JSON.parse(raw);
    // Defensive merge so we don't crash on older shapes
    const e = EMPTY();
    return {
      cheese: { ...e.cheese, ...(parsed.cheese || {}) },
      rice:   { ...e.rice,   ...(parsed.rice   || {}) },
      pan:    { ...e.pan,    ...(parsed.pan    || {}) },
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
    };
  } catch {
    return EMPTY();
  }
};

const saveStats = (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
};

/**
 * Record a finished simulator run.
 * @param {"cheese"|"rice"|"pan"} sim
 * @param {string} outcomeKey  e.g. "perfect", "fire", "nuclear", "scorched", "burnt", "disaster"
 * @param {"EASY"|"NORMAL"|"HARD"} difficulty
 * @returns {{unlocked: string[], streak: number, best: number}}
 *   unlocked = newly unlocked badge ids this run
 *   streak   = currentStreak after this run (for the given sim)
 *   best     = bestStreak after this run (for the given sim)
 */
export const recordOutcome = (sim, outcomeKey, difficulty = "NORMAL") => {
  const s = getStats();
  if (!s[sim]) return { unlocked: [], streak: 0, best: 0 };
  s[sim].plays += 1;

  if (outcomeKey === "perfect") {
    s[sim].perfects += 1;
    if (difficulty === "HARD") s[sim].hardPerfects += 1;
    s[sim].currentStreak = (s[sim].currentStreak || 0) + 1;
    if (s[sim].currentStreak > (s[sim].bestStreak || 0)) {
      s[sim].bestStreak = s[sim].currentStreak;
    }
  } else {
    // Any non-perfect outcome breaks the streak.
    s[sim].currentStreak = 0;
  }

  if (sim === "cheese") {
    if (outcomeKey === "fire") s.cheese.fires += 1;
    if (outcomeKey === "nuclear") s.cheese.nukes += 1;
  }
  if (sim === "rice") {
    if (outcomeKey === "scorched") s.rice.scorches += 1;
    if (outcomeKey === "disaster") s.rice.disasters += 1;
  }
  if (sim === "pan") {
    if (outcomeKey === "burnt") s.pan.burns += 1;
    if (outcomeKey === "scorched") s.pan.scorches += 1;
  }

  const before = new Set(s.unlocked);
  const newlyUnlocked = [];
  for (const b of BADGES) {
    if (!before.has(b.id) && b.check(s)) {
      newlyUnlocked.push(b.id);
      s.unlocked.push(b.id);
    }
  }
  saveStats(s);
  return {
    unlocked: newlyUnlocked,
    streak: s[sim].currentStreak,
    best: s[sim].bestStreak,
  };
};

export const resetStats = () => {
  saveStats(EMPTY());
};

export const getUnlockedBadges = () => {
  const s = getStats();
  return BADGES.filter((b) => s.unlocked.includes(b.id));
};

/** Read-only helper for displaying streaks in HUDs without recording an outcome. */
export const getCurrentStreak = (sim) => {
  const s = getStats();
  return s[sim]?.currentStreak || 0;
};
