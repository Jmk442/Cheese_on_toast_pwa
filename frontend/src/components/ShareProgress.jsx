import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { track } from "../lib/analytics";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

/**
 * Viral share — one-tap "I just unlocked X badges on Cheese on Toast" button.
 * Uses the native Web Share API on mobile (iOS/Android share sheet) and
 * falls back to copy-link on desktop.
 *
 * Driven by the user's current badge count + their best streak across sims.
 */
export const ShareProgress = ({ badgeCount, totalBadges, bestStreak, deviceId }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?via=${deviceId || ""}`;

  const text =
    badgeCount > 0
      ? `🔥 I just unlocked ${badgeCount}/${totalBadges} badges on Cheese on Toast${bestStreak >= 3 ? ` (best streak: ${bestStreak})` : ""}. It's a kitchen simulator for teenagers. Don't burn the grill: ${url}`
      : `🧀 Practising cooking on Cheese on Toast — a kitchen simulator for teenagers. Don't burn the grill: ${url}`;

  const onShare = async () => {
    track("share_progress_clicked", { count: badgeCount, streak: bestStreak });

    // Native share sheet on mobile (iOS/Android)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Cheese on Toast",
          text,
          url,
        });
        setShared(true);
        track("share_progress_completed", { method: "native" });
        return;
      } catch (e) {
        // User cancelled or error — fall through to clipboard
      }
    }

    // Desktop fallback — copy to clipboard
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        track("share_progress_completed", { method: "clipboard" });
        setTimeout(() => setCopied(false), 2200);
      }
    } catch { /* noop */ }
  };

  return (
    <div data-testid="share-progress" className="brut-card-yellow p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="font-display font-black uppercase text-sm text-ink">Show off your progress</div>
          <div className="font-mono text-xs text-ink/80">
            One tap to share. Friends who join via your link give you both a streak boost.
          </div>
        </div>
        <button
          type="button"
          data-testid="share-progress-btn"
          onClick={onShare}
          className="inline-flex items-center gap-2 bg-ink text-foreground border-2 border-ink px-4 py-2 font-display font-black uppercase text-xs sm:text-sm tracking-tight hover:bg-foreground hover:text-ink transition-colors"
        >
          {shared ? <Check size={16} /> : copied ? <Copy size={16} /> : <Share2 size={16} />}
          {shared ? "Shared!" : copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
};
