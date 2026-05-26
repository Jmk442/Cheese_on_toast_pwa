import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Palette, Handshake, Bell, BarChart3, Mail, Shield, ArrowRight, RotateCcw } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { usePremium } from "../context/PremiumContext";
import { getAffiliatePreview } from "../lib/api";
import { track } from "../lib/analytics";
import { AccountLinkCard } from "../components/AccountLinkCard";

const THEMES = [
  { id: "yellow", label: "Classic Yellow", swatch: "#FACC15", free: true },
  { id: "neon",   label: "Neon Pink",      swatch: "#EC4899", free: false },
  { id: "mint",   label: "Mint Calm",      swatch: "#10B981", free: false },
  { id: "slime",  label: "Toxic Slime",    swatch: "#84CC16", free: false },
];

export default function Settings() {
  const { deviceId, premium, isPremium, isLifetime, isTrial, trialDaysLeft, cosmetic, setCosmetic } = usePremium();
  const [affiliate, setAffiliate] = useState(null);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [pushOptIn, setPushOptIn] = useState(false);

  useEffect(() => {
    getAffiliatePreview().then(setAffiliate).catch(() => null);
  }, []);

  const handleTheme = (t) => {
    if (!t.free && !isPremium) return;
    setCosmetic(t.id);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const locked = !t.free && !isPremium;
            const active = cosmetic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-testid={`theme-${t.id}`}
                onClick={() => handleTheme(t)}
                disabled={locked}
                className={`p-3 border-2 space-y-2 text-left transition-colors ${
                  active ? "border-brand-primary bg-ink" : "border-white/30 hover:border-white"
                } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="w-full h-8 border-2 border-ink" style={{ background: t.swatch }} />
                <div className="font-mono text-xs uppercase tracking-widest">{t.label}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                  {t.free ? "Free" : locked ? "Premium" : "Unlocked"}
                </div>
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">More cosmetics & kitchen avatars coming soon.</p>
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

      {/* Engagement (push placeholder + email) */}
      <section data-testid="settings-engagement" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Notifications</h2>
        <div className="brut-card p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer" data-testid="opt-push">
            <input
              type="checkbox"
              checked={pushOptIn}
              onChange={(e) => { setPushOptIn(e.target.checked); track("push_opt_in_toggled", { value: e.target.checked }); }}
              className="mt-1 accent-brand-primary"
            />
            <div>
              <div className="font-display font-bold uppercase text-sm inline-flex items-center gap-2"><Bell size={14} /> Push notifications</div>
              <div className="font-mono text-[11px] text-foreground/60">Mealtime nudges, badge unlocks, streak reminders. (Coming soon — placeholder.)</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer" data-testid="opt-email">
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
        <div className="brut-card p-4 space-y-2 font-mono text-xs text-foreground/70">
          <div className="inline-flex items-center gap-2"><BarChart3 size={12} /> Anonymous device ID: <span className="text-foreground/40 text-[10px]">{deviceId?.slice(0, 18)}...</span></div>
          <p>We track which features get used so we can build better ones. No email, no name, no contacts.</p>
          <button
            type="button"
            data-testid="reset-device"
            onClick={() => {
              if (!window.confirm("This will reset your device ID, achievements, saved recipes and meal plan. Continue?")) return;
              try {
                ["cot.device_id.v1", "cot.stats.v1", "cot.saved.v1", "cot.mealplan.v1", "cot.grocery.v1", "cot.cosmetic.v1", "cot.referrer.v1"].forEach((k) => localStorage.removeItem(k));
              } catch { /* noop */ }
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/60 hover:text-brand-danger"
          >
            <RotateCcw size={12} /> Reset everything on this device
          </button>
        </div>
      </section>
    </div>
  );
}
