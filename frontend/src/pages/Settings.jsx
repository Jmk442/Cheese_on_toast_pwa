import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Palette, Handshake, Bell, BarChart3, Mail, Shield, ArrowRight, RotateCcw, Lock } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { usePremium } from "../context/PremiumContext";
import { getAffiliatePreview } from "../lib/api";
import { track } from "../lib/analytics";
import { AccountLinkCard } from "../components/AccountLinkCard";
import { THEMES, isThemeUnlocked } from "../lib/themes";
import { getStats } from "../lib/achievements";
import { pushSupported, getPushStatus, subscribeToPush, unsubscribeFromPush, sendTestPush } from "../lib/push";

export default function Settings() {
  const { deviceId, premium, isPremium, isLifetime, isTrial, trialDaysLeft, cosmetic, setCosmetic } = usePremium();
  const [affiliate, setAffiliate] = useState(null);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [pushState, setPushState] = useState({ supported: false, permission: "default", subscribed: false });
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState(null);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState([]);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    getAffiliatePreview().then(setAffiliate).catch(() => null);
    setUnlockedBadgeIds(getStats().unlocked || []);
    getPushStatus().then(setPushState).catch(() => null);
    const onFocus = () => setUnlockedBadgeIds(getStats().unlocked || []);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const togglePush = async (enable) => {
    if (!deviceId) return;
    setPushBusy(true);
    setPushMsg(null);
    try {
      if (enable) {
        await subscribeToPush(deviceId);
        track("push_subscribed");
        setPushMsg({ tone: "ok", text: "Notifications enabled. We'll only ping you about streaks and big wins." });
      } else {
        await unsubscribeFromPush(deviceId);
        track("push_unsubscribed");
        setPushMsg({ tone: "ok", text: "Notifications turned off." });
      }
      setPushState(await getPushStatus());
    } catch (e) {
      setPushMsg({ tone: "err", text: e?.message || "Couldn't update notifications." });
    } finally {
      setPushBusy(false);
    }
  };

  const onTestPush = async () => {
    if (!deviceId) return;
    setPushBusy(true);
    setPushMsg(null);
    try {
      await sendTestPush(deviceId);
      setPushMsg({ tone: "ok", text: "Test sent — check for the notification." });
      track("push_test_sent");
    } catch (e) {
      setPushMsg({ tone: "err", text: e?.message || "Couldn't send test notification." });
    } finally {
      setPushBusy(false);
    }
  };

  const handleTheme = (t) => {
    if (!isThemeUnlocked(t, { isPremium, unlockedBadgeIds })) return;
    setCosmetic(t.id);
    track("theme_selected", { id: t.id });
  };

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/?via=${deviceId || ""}`;

  return (
    <div data-testid="settings-page" className="space-y-7">
      <SeoHead
        title="Settings — Cheese on Toast"
        description="Manage subscription, kitchen cosmetics, affiliate program and notifications."
        canonicalPath="/settings"
      />

      <header className="space-y-2 pt-1">
        <span className="label-tag">SETTINGS</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Your Kitchen
        </h1>
      </header>

      {/* Subscription */}
      <section data-testid="settings-subscription" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Subscription</h2>
        <div className="brut-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Crown size={18} className={isPremium ? "text-brand-primary" : "text-foreground/40"} />
            <span className="font-display font-black uppercase text-sm">
              {isLifetime ? "Lifetime Premium" : isTrial ? "Trial active" : isPremium ? "Monthly Premium" : "Free plan"}
            </span>
          </div>
          {isTrial && trialDaysLeft !== null && (
            <p className="font-mono text-xs text-foreground/80">Trial ends in <strong>{trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}</strong>. After that you'll need to upgrade to keep premium.</p>
          )}
          {isPremium && !isLifetime && premium?.premium_until && (
            <p className="font-mono text-xs text-foreground/70">Renews / expires: {new Date(premium.premium_until).toLocaleDateString()}</p>
          )}
          {!isPremium && (
            <Link to="/premium" data-testid="settings-upgrade" className="btn-arcade w-full mt-2 inline-flex">
              Start 3-day trial <ArrowRight size={16} />
            </Link>
          )}
          {isPremium && !isLifetime && (
            <Link to="/premium#lifetime" data-testid="settings-lifetime-upsell" className="btn-arcade btn-ghost w-full mt-2 inline-flex">
              Upgrade to Lifetime (A$24.99)
            </Link>
          )}
        </div>
      </section>

      {/* Account link */}
      <AccountLinkCard />

      {/* Cosmetics */}
      <section data-testid="settings-cosmetics" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Palette size={18} /> Kitchen Theme</h2>
        <p className="font-mono text-[11px] text-foreground/60">Earn themes by completing achievements. Premium unlocks them all instantly.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const unlocked = isThemeUnlocked(t, { isPremium, unlockedBadgeIds });
            const active = cosmetic === t.id;
            const isFree = t.unlock?.type === "free";
            const earnedViaBadge = !isFree && t.unlock?.type === "badge" && unlockedBadgeIds.includes(t.unlock.badge);
            let statusLabel;
            if (isFree) statusLabel = "Free";
            else if (earnedViaBadge) statusLabel = "Earned";
            else if (unlocked) statusLabel = "Premium";
            else statusLabel = "Locked";
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`theme-${t.id}`}
                onClick={() => handleTheme(t)}
                disabled={!unlocked}
                title={!unlocked && t.unlock?.hint ? t.unlock.hint : undefined}
                className={`p-3 border-2 space-y-2 text-left transition-colors ${
                  active ? "border-brand-primary bg-ink" : "border-white/30 hover:border-white"
                } ${!unlocked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="w-full h-8 border-2 border-ink relative" style={{ background: t.swatch }}>
                  {!unlocked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/70">
                      <Lock size={12} className="text-white" />
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest">{t.label}</div>
                <div className={`font-mono text-[10px] uppercase tracking-widest ${earnedViaBadge ? "text-brand-perfect" : "text-foreground/40"}`}>
                  {statusLabel}
                </div>
                {!unlocked && t.unlock?.hint && (
                  <div className="font-mono text-[10px] text-foreground/50 leading-tight" data-testid={`theme-hint-${t.id}`}>
                    {t.unlock.hint}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">Play the sandboxes to unlock more.</p>
      </section>

      {/* Referral */}
      <section data-testid="settings-referral" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Refer a Friend</h2>
        <div className="brut-card p-4 space-y-2">
          <p className="font-mono text-sm text-foreground/80">Share this link. When a friend joins, you both get a streak boost and a "Spread the Toast" badge (coming soon).</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              data-testid="referral-link-input"
              className="flex-1 bg-ink border-2 border-white/30 p-2 font-mono text-[11px] text-foreground/70 focus:border-brand-primary outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              data-testid="referral-copy"
              onClick={async () => {
                try {
                  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(referralLink);
                  track("referral_link_copied");
                } catch { /* noop */ }
              }}
              className="btn-arcade px-3 py-2"
            >
              Copy
            </button>
          </div>
        </div>
      </section>

      {/* Affiliate */}
      <section data-testid="settings-affiliate" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Handshake size={18} /> Affiliate Program</h2>
        <div className="brut-card p-4 space-y-2">
          <p className="font-mono text-sm text-foreground/80">{affiliate?.description || "Earn recurring revenue by referring premium subscribers. Coming soon."}</p>
          <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
            Rev share: {affiliate?.rev_share_percent ?? 30}% · Cookie window: {affiliate?.cookie_window_days ?? 30}d
          </div>
          <button type="button" data-testid="affiliate-waitlist" className="btn-arcade btn-ghost w-full" onClick={() => track("affiliate_waitlist_joined")}>
            Join the waitlist
          </button>
        </div>
      </section>

      {/* Engagement (push + email) */}
      <section data-testid="settings-engagement" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Notifications</h2>
        <div className="brut-card p-4 space-y-3">
          <div data-testid="opt-push" className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex w-9 h-9 items-center justify-center bg-brand-primary text-ink border-2 border-white flex-none">
                <Bell size={14} strokeWidth={2.5} />
              </span>
              <div className="flex-1">
                <div className="font-display font-bold uppercase text-sm">Push notifications</div>
                <div className="font-mono text-[11px] text-foreground/60">Streak reminders every few days. No spam, ever.</div>
                {!pushState.supported && (
                  <div className="font-mono text-[10px] text-foreground/40 mt-1">Not supported on this browser. Install the app to your home screen first.</div>
                )}
                {pushState.permission === "denied" && (
                  <div className="font-mono text-[10px] text-brand-danger mt-1">You've blocked notifications. Allow them in your browser settings to enable.</div>
                )}
              </div>
              {pushState.supported && pushState.permission !== "denied" && (
                pushState.subscribed ? (
                  <button
                    type="button"
                    data-testid="push-disable"
                    onClick={() => togglePush(false)}
                    disabled={pushBusy}
                    className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border-2 border-white/60 hover:border-brand-danger hover:text-brand-danger"
                  >
                    {pushBusy ? "…" : "Turn off"}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="push-enable"
                    onClick={() => togglePush(true)}
                    disabled={pushBusy}
                    className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 bg-brand-primary text-ink border-2 border-brand-primary"
                  >
                    {pushBusy ? "…" : "Enable"}
                  </button>
                )
              )}
            </div>
            {pushState.subscribed && (
              <button
                type="button"
                data-testid="push-test"
                onClick={onTestPush}
                disabled={pushBusy}
                className="text-[10px] font-mono uppercase tracking-widest text-brand-primary hover:underline"
              >
                Send me a test notification
              </button>
            )}
            {pushMsg && (
              <div data-testid="push-msg" className={`font-mono text-[11px] ${pushMsg.tone === "ok" ? "text-brand-perfect" : "text-brand-danger"}`}>
                {pushMsg.text}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer pt-3 border-t-2 border-white/10" data-testid="opt-email">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => { setEmailOptIn(e.target.checked); track("email_opt_in_toggled", { value: e.target.checked }); }}
              className="mt-1 accent-brand-primary"
            />
            <div>
              <div className="font-display font-bold uppercase text-sm inline-flex items-center gap-2"><Mail size={14} /> Weekly recipe email</div>
              <div className="font-mono text-[11px] text-foreground/60">New seasonal recipes + meal-plan suggestions. (Coming soon — placeholder.)</div>
            </div>
          </label>
        </div>
      </section>

      {/* Privacy / analytics */}
      <section data-testid="settings-privacy" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Shield size={18} /> Privacy & Data</h2>
        <div className="brut-card p-4 space-y-3 font-mono text-xs text-foreground/70">
          <div className="inline-flex items-center gap-2"><BarChart3 size={12} /> Anonymous device ID: <span className="text-foreground/40 text-[10px]">{deviceId?.slice(0, 18)}...</span></div>
          <p>We track which features get used so we can build better ones. No email, no name, no contacts.</p>
          {confirmingReset ? (
            <div className="flex items-center gap-2 pt-1" data-testid="reset-device-confirm-row">
              <span className="text-foreground/70">Wipe device ID, achievements, saved recipes, meal plan?</span>
              <button
                type="button"
                data-testid="reset-device-cancel"
                onClick={() => setConfirmingReset(false)}
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="reset-device-confirm"
                onClick={() => {
                  try {
                    ["cot.device_id.v1", "cot.stats.v1", "cot.saved.v1", "cot.mealplan.v1", "cot.grocery.v1", "cot.cosmetic.v1", "cot.referrer.v1", "cot.streak_reminder.v1"].forEach((k) => localStorage.removeItem(k));
                  } catch { /* noop */ }
                  window.location.href = "/";
                }}
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-brand-danger text-brand-danger"
              >
                Wipe
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="reset-device"
              onClick={() => setConfirmingReset(true)}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/60 hover:text-brand-danger"
            >
              <RotateCcw size={12} /> Reset everything on this device
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
