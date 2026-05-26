import { useEffect, useState } from "react";
import { Trophy, Crown, ChefHat, Award, UtensilsCrossed, Flame, Gamepad2, Swords, Zap } from "lucide-react";

const ICONS = { Trophy, Crown, ChefHat, Award, UtensilsCrossed, Flame, Gamepad2, Swords };

/**
 * Small overlay toast shown when one or more badges unlock at the end of a sim run.
 * Auto-dismisses after `duration` ms. Use via:
 *   <AchievementBanner badges={[badgeObject, ...]} onClose={() => setBadges([])} />
 */
export const AchievementBanner = ({ badges = [], onClose, duration = 4500 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badges.length > 0) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [badges, duration, onClose]);

  if (!visible || badges.length === 0) return null;

  return (
    <div
      data-testid="achievement-banner"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-rise"
    >
      <div className="brut-card-yellow p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-ink" />
          <span className="font-display font-black uppercase tracking-tight text-sm">
            {badges.length === 1 ? "Badge Unlocked" : `${badges.length} Badges Unlocked`}
          </span>
        </div>
        <div className="space-y-2">
          {badges.map((b) => {
            const Icon = ICONS[b.icon] || Trophy;
            return (
              <div key={b.id} className="flex items-start gap-3 bg-ink text-foreground border-2 border-ink p-3">
                <span className="inline-flex w-10 h-10 items-center justify-center bg-brand-primary text-ink border-2 border-foreground flex-none">
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                <div className="flex-1">
                  <div className="font-display font-black uppercase text-sm leading-tight">{b.name}</div>
                  <div className="font-mono text-xs text-foreground/70 mt-0.5">{b.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
