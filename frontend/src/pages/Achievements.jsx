import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Crown, ChefHat, Award, UtensilsCrossed, Flame, Gamepad2, Swords, Lock, RotateCcw, Backpack, Wallet, Wind, CalendarDays, ShoppingCart, Leaf, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { BADGES, getStats, resetStats } from "../lib/achievements";
import { PREMIUM_BADGES } from "../data/collections";
import { usePremium } from "../context/PremiumContext";
import { SeoHead } from "../components/SeoHead";
import { ShareProgress } from "../components/ShareProgress";

const ICONS = { Trophy, Crown, ChefHat, Award, UtensilsCrossed, Flame, Gamepad2, Swords, Backpack, Wallet, Wind, CalendarDays, ShoppingCart, Leaf, Sparkles, Zap };

export default function Achievements() {
  const [stats, setStats] = useState(getStats());
  const [confirming, setConfirming] = useState(false);
  const { isPremium, deviceId } = usePremium();

  const refresh = () => setStats(getStats());

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const unlockedCount = stats.unlocked.length;

  const doReset = () => {
    resetStats();
    refresh();
    setConfirming(false);
  };

  return (
    <div data-testid="achievements-page" className="space-y-6">
      <SeoHead
        title="Achievements — Cheese on Toast App"
        description="Unlock badges as you master cheese on toast, boiled rice and saucepan heating in the simulators."
        canonicalPath="/achievements"
      />

      <div className="pt-1">
        <Link
          to="/"
          data-testid="back-home-link"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Home
        </Link>
      </div>

      <header className="space-y-2">
        <span className="label-tag">PROGRESS</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Achievements
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Earn badges by surviving the sims. Or by spectacularly failing them.
        </p>
      </header>

      {/* Stats overview */}
      <section data-testid="stats-overview" className="grid grid-cols-3 gap-2">
        {[
          { k: "cheese", label: "Cheese" },
          { k: "rice",   label: "Rice" },
          { k: "pan",    label: "Pan" },
        ].map((row) => (
          <div key={row.k} className="brut-card p-3" data-testid={`stat-${row.k}`}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">{row.label}</div>
            <div className="font-display font-black text-2xl text-brand-primary timer-digit">{stats[row.k].perfects}<span className="text-foreground/30 text-base">/{stats[row.k].plays}</span></div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">perfects/plays</div>
          </div>
        ))}
      </section>

      {/* Streaks overview */}
      <section data-testid="streaks-overview" className="brut-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black uppercase tracking-tight text-lg inline-flex items-center gap-2">
            <Zap size={16} className="text-brand-primary" /> Perfect Streaks
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">in a row</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: "cheese", label: "Cheese" },
            { k: "rice",   label: "Rice" },
            { k: "pan",    label: "Pan" },
          ].map((row) => {
            const cur = stats[row.k]?.currentStreak || 0;
            const best = stats[row.k]?.bestStreak || 0;
            const onFire = cur >= 3;
            return (
              <div key={row.k} data-testid={`streak-${row.k}`} className={`border-2 p-2 space-y-1 ${onFire ? "border-brand-danger" : "border-white/20"}`}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">{row.label}</div>
                <div className={`font-display font-black text-xl timer-digit ${onFire ? "text-brand-danger" : "text-foreground"}`} data-testid={`streak-${row.k}-current`}>
                  {cur}{onFire && <Flame size={14} className="inline ml-1 -mt-1 text-brand-danger" />}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  best <span className="text-brand-primary" data-testid={`streak-${row.k}-best`}>{best}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-end justify-between">
        <div className="font-mono text-xs text-foreground/60">
          <span data-testid="badge-count" className="text-brand-primary font-bold">{unlockedCount}</span> of {BADGES.length} unlocked
        </div>
        {unlockedCount > 0 && (
          confirming ? (
            <div className="flex items-center gap-2">
              <button type="button" data-testid="reset-cancel" onClick={() => setConfirming(false)} className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-white/60">Cancel</button>
              <button type="button" data-testid="reset-confirm" onClick={doReset} className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-brand-danger text-brand-danger">Wipe</button>
            </div>
          ) : (
            <button type="button" data-testid="reset-stats" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-danger">
              <RotateCcw size={12} /> Reset
            </button>
          )
        )}
      </div>

      <ShareProgress
        badgeCount={unlockedCount}
        totalBadges={BADGES.length}
        bestStreak={Math.max(stats.cheese?.bestStreak || 0, stats.rice?.bestStreak || 0, stats.pan?.bestStreak || 0)}
        deviceId={deviceId}
      />

      {/* Badge grid */}
      <section data-testid="badge-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const Icon = ICONS[b.icon] || Trophy;
          const got = stats.unlocked.includes(b.id);
          return (
            <div
              key={b.id}
              data-testid={`badge-${b.id}`}
              className={`p-4 border-2 space-y-2 transition-all ${
                got ? "border-brand-primary bg-ink" : "border-white/15 bg-ink/40 opacity-70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex w-10 h-10 items-center justify-center border-2 ${
                  got ? "bg-brand-primary text-ink border-ink" : "bg-ink text-foreground/30 border-white/20"
                }`}>
                  {got ? <Icon size={18} strokeWidth={2.5} /> : <Lock size={16} />}
                </span>
                <span className={`font-display font-black uppercase text-sm leading-tight ${got ? "" : "text-foreground/50"}`}>{b.name}</span>
              </div>
              <p className={`font-mono text-xs ${got ? "text-foreground/80" : "text-foreground/40"}`}>{b.description}</p>
            </div>
          );
        })}
      </section>

      {/* Premium badges — locked unless premium */}
      <section data-testid="premium-badges-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black uppercase tracking-tight text-xl inline-flex items-center gap-2"><Sparkles size={18} className="text-brand-primary" /> Premium Badges</h2>
          {!isPremium && (
            <Link to="/premium" data-testid="premium-badges-upsell" className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-ink">
              Unlock
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="premium-badge-grid">
          {PREMIUM_BADGES.map((b) => {
            const Icon = ICONS[b.icon] || Trophy;
            return (
              <div
                key={b.id}
                data-testid={`premium-badge-${b.id}`}
                className={`p-4 border-2 space-y-2 ${
                  isPremium ? "border-brand-primary/60 bg-ink" : "border-white/15 bg-ink/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex w-10 h-10 items-center justify-center border-2 ${
                    isPremium ? "bg-brand-primary/20 text-brand-primary border-brand-primary/60" : "bg-ink text-foreground/30 border-white/20"
                  }`}>
                    {isPremium ? <Icon size={18} strokeWidth={2.5} /> : <Lock size={16} />}
                  </span>
                  <span className={`font-display font-black uppercase text-sm leading-tight ${isPremium ? "" : "text-foreground/50"}`}>{b.name}</span>
                </div>
                <p className={`font-mono text-xs ${isPremium ? "text-foreground/80" : "text-foreground/40"}`}>{b.description}</p>
              </div>
            );
          })}
        </div>
        {!isPremium && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
            Start your 3-day free trial to unlock the premium badge track.
          </p>
        )}
      </section>

      <div className="brut-card p-5 space-y-3" data-testid="sandboxes-cta">
        <h2 className="font-display font-black uppercase tracking-tight text-lg">Play to unlock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link to="/simulator" data-testid="play-cheese" className="border-2 border-white/60 p-3 hover:border-brand-primary hover:text-brand-primary transition-colors">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Sim 01</div>
            <div className="font-display font-bold uppercase text-sm">Cheese on Toast</div>
          </Link>
          <Link to="/simulator/boiled-rice" data-testid="play-rice" className="border-2 border-white/60 p-3 hover:border-brand-primary hover:text-brand-primary transition-colors">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Sim 02</div>
            <div className="font-display font-bold uppercase text-sm">Boiled Rice</div>
          </Link>
          <Link to="/simulator/saucepan-heating" data-testid="play-pan" className="border-2 border-white/60 p-3 hover:border-brand-primary hover:text-brand-primary transition-colors">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Sim 03</div>
            <div className="font-display font-bold uppercase text-sm">Saucepan</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
