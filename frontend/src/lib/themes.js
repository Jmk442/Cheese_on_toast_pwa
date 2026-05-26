// Theme registry. Each theme can be unlocked by either:
//  - being premium (all themes instantly available), OR
//  - earning the linked achievement badge.
//
// The `yellow` default is always free. Premium does NOT shortcut you out of
// playing — it's just a fast-track / showcase for paying users.

export const THEMES = [
  {
    id: "yellow",
    label: "Classic Yellow",
    swatch: "#FACC15",
    unlock: { type: "free" },
  },
  {
    id: "neon",
    label: "Neon Pink",
    swatch: "#EC4899",
    unlock: { type: "badge", badge: "first-toast", hint: "Get a PERFECT cheese-on-toast." },
  },
  {
    id: "mint",
    label: "Mint Calm",
    swatch: "#10B981",
    unlock: { type: "badge", badge: "rice-rookie", hint: "Boil rice without burning the pan." },
  },
  {
    id: "slime",
    label: "Toxic Slime",
    swatch: "#84CC16",
    unlock: { type: "badge", badge: "chaos", hint: "Cause a nuclear, disaster or scorched run." },
  },
  {
    id: "inferno",
    label: "Inferno",
    swatch: "#EF4444",
    unlock: { type: "badge", badge: "streak-5", hint: "Hit a 5-perfect streak in any sim." },
  },
  {
    id: "arcade",
    label: "Arcade Cyan",
    swatch: "#06B6D4",
    unlock: { type: "badge", badge: "iron-chef", hint: "Three perfects on HARD across the sims." },
  },
];

/**
 * Decide whether a theme is unlocked for the current user.
 *  - free themes: always unlocked
 *  - badge themes: unlocked if user has earned the badge OR has premium
 *
 * @param {object} theme    THEMES entry
 * @param {object} opts     { isPremium: boolean, unlockedBadgeIds: string[] }
 * @returns {boolean}
 */
export const isThemeUnlocked = (theme, { isPremium = false, unlockedBadgeIds = [] } = {}) => {
  if (!theme || !theme.unlock) return true;
  if (theme.unlock.type === "free") return true;
  if (isPremium) return true;
  if (theme.unlock.type === "badge") {
    return unlockedBadgeIds.includes(theme.unlock.badge);
  }
  return false;
};

export const getThemeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
