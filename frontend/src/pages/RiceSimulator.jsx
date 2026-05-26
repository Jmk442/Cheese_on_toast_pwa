import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Flame, Volume2, VolumeX } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { AchievementBanner } from "../components/AchievementBanner";
import { recordOutcome, getStats, BADGES } from "../lib/achievements";
import { ShareButton } from "../components/ShareButton";

/**
 * Rice Boil-Dry Meter Simulator
 *
 * Phases (sim time, 1 real sec ~= 30 sim sec):
 *   0:00 - 0:30  pouring / cold
 *   0:30 - 1:30  warming
 *   1:30 - 2:30  BOILING (user must turn heat DOWN within this window)
 *   2:30 - 12:00 simmering (lid on, water level dropping)
 *   12:00+       water gone — user must turn OFF (perfect window 11:30 - 12:30)
 *
 * Heat states: OFF | LOW | HIGH
 *  - HIGH consumes water 3x faster than LOW
 *  - Burn risk if heat HIGH after water < 10%
 *  - Undercook if turned OFF with water > 25% AND sim < 10:00
 */

const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

const beep = (ctxRef, freq = 880, dur = 0.08) => {
  try {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (_e) { /* noop */ }
};

export default function RiceSimulator() {
  const [started, setStarted] = useState(false);
  const [simSec, setSimSec] = useState(0);
  const [heat, setHeat] = useState("HIGH"); // OFF | LOW | HIGH
  const [water, setWater] = useState(100);  // percentage
  const [boilHit, setBoilHit] = useState(false);
  const [turnedDownInTime, setTurnedDownInTime] = useState(null); // true/false
  const [outcome, setOutcome] = useState(null);
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState("NORMAL");
  const [newBadges, setNewBadges] = useState([]);
  const [streak, setStreak] = useState(() => getStats().rice.currentStreak || 0);
  const [bestStreak, setBestStreak] = useState(() => getStats().rice.bestStreak || 0);

  const diffRate = difficulty === "HARD" ? 1.4 : difficulty === "EASY" ? 0.75 : 1.0;

  const intRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!started || outcome) return;
    intRef.current = setInterval(() => {
      setSimSec((s) => {
        const next = s + 6; // 6 sim-sec per 200ms tick = 30 sim-sec/real-sec

        // Boiling marker
        if (!boilHit && next >= 90 && next < 150) {
          setBoilHit(true);
          if (!muted) beep(audioRef, 1000, 0.12);
        }
        // After boiling window closes, lock in whether they turned down in time
        if (turnedDownInTime === null && next >= 150) {
          setTurnedDownInTime(heat !== "HIGH");
        }

        // Water consumption rate (scaled by difficulty)
        setWater((w) => {
          let rate = 0;
          if (heat === "HIGH") rate = 1.4 * diffRate;
          else if (heat === "LOW") rate = 0.45 * diffRate;
          // No evaporation before things get hot
          if (next < 60) rate = 0;
          const nw = Math.max(0, w - rate);
          return nw;
        });
        return next;
      });
    }, 200);
    return () => clearInterval(intRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, outcome, heat, muted, boilHit, turnedDownInTime, diffRate]);

  // Auto-fail conditions while running
  useEffect(() => {
    if (!started || outcome) return;
    // Burn: water gone + heat still on for too long
    if (water <= 0 && heat !== "OFF") {
      // grace period: a few sim seconds — convert by checking how long it's been
      // simpler rule: once water hits 0 and heat is on, advance to burnt outcome after 0 (instant)
      finish("scorched");
      return;
    }
    // Pan-melting disaster: heat HIGH after sim > 4:00 — runaway
    if (simSec > 360 && heat === "HIGH" && water < 30) {
      finish("disaster");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [water, heat, simSec, started]);

  const finish = (key) => {
    let result;
    if (key === "perfect") {
      result = { key, title: "PERFECT RICE", body: "Fluffy. Cooked through. No stick. Nailed it.", tone: "text-brand-perfect" };
    } else if (key === "undercooked") {
      result = { key, title: "UNDERCOOKED", body: "You turned it off too early — there was still water in the pan. Rice is still hard.", tone: "text-brand-primary" };
    } else if (key === "almost") {
      result = { key, title: "ALMOST", body: "Bit firmer than perfect. A minute longer next time.", tone: "text-brand-primary" };
    } else if (key === "scorched") {
      result = { key, title: "BURNT BOTTOM", body: "Water gone, heat still on. The bottom layer is glued to the pan. Soak it overnight.", tone: "text-brand-danger" };
    } else if (key === "didnt-turn-down") {
      result = { key, title: "BOILED OVER", body: "You left it on HIGH after it boiled. Water all over the hob. The smoke alarm is your fault.", tone: "text-brand-danger" };
    } else if (key === "disaster") {
      result = { key, title: "PAN DESTROYED", body: "You walked away on HIGH. The water's gone, the pan's glowing, the rice is charcoal.", tone: "text-brand-toxic" };
    }
    clearInterval(intRef.current);
    setOutcome(result);
    if (!muted) beep(audioRef, key === "perfect" ? 1200 : 220, 0.4);
    const { unlocked, streak: newStreak, best } = recordOutcome("rice", key, difficulty);
    setStreak(newStreak);
    setBestStreak(best);
    if (unlocked.length > 0) {
      setNewBadges(BADGES.filter((b) => unlocked.includes(b.id)));
    }
  };

  const onDone = () => {
    // Choose outcome based on state
    if (turnedDownInTime === false) return finish("didnt-turn-down");
    if (water > 25 && simSec < 540) return finish("undercooked");
    if (water > 10 && water <= 25) return finish("almost");
    if (water <= 10 && water > 0) return finish("perfect");
    return finish("scorched");
  };

  const reset = () => {
    clearInterval(intRef.current);
    setStarted(false);
    setSimSec(0);
    setHeat("HIGH");
    setWater(100);
    setBoilHit(false);
    setTurnedDownInTime(null);
    setOutcome(null);
    setNewBadges([]);
  };

  const phaseLabel =
    !started ? "READY" :
    simSec < 60 ? "WARMING" :
    simSec < 90 ? "ABOUT TO BOIL" :
    simSec < 150 ? "BOILING — turn it DOWN" :
    water > 25 ? "SIMMERING" :
    water > 10 ? "ALMOST DRY" :
    water > 0  ? "PERFECT WINDOW — turn OFF" :
    "WATER GONE";

  const phaseTone =
    simSec >= 90 && simSec < 150 ? "text-brand-primary" :
    water > 0 && water <= 10 ? "text-brand-perfect" :
    water === 0 ? "text-brand-danger" :
    "text-foreground";

  const HeatBtn = ({ value, label, tone }) => (
    <button
      type="button"
      data-testid={`heat-${value.toLowerCase()}`}
      onClick={() => setHeat(value)}
      className={`flex-1 py-3 px-2 border-2 font-display font-bold uppercase text-xs sm:text-sm transition-colors ${
        heat === value
          ? `${tone} border-current`
          : "border-white/30 text-foreground/60 hover:border-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-testid="rice-sim-page" className="space-y-6">
      <AchievementBanner badges={newBadges} onClose={() => setNewBadges([])} />
      <SeoHead
        title="Boiled Rice Sandbox — Practice Without Burning the Pan"
        description="Practice boiling rice in our visual sandbox. Manage the heat, watch the water level, turn it off at the right moment. Get it wrong and watch the pan die."
        canonicalPath="/simulator/boiled-rice"
      />

      <div className="flex items-center justify-between pt-1">
        <Link to="/recipe/boiled-rice" data-testid="back-link" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary">
          <ArrowLeft size={14} /> Recipe
        </Link>
        <div className="flex items-center gap-3">
          <span
            data-testid="streak-indicator"
            className={`inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest ${streak >= 3 ? "text-brand-danger" : streak > 0 ? "text-brand-perfect" : "text-foreground/40"}`}
            title={`Best streak: ${bestStreak}`}
          >
            <Flame size={12} /> Streak <span data-testid="streak-value" className="timer-digit">{streak}</span>
          </span>
          <button
            type="button"
            data-testid="mute-toggle"
            onClick={() => setMuted((m) => !m)}
            className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? "Muted" : "Sound on"}
          </button>
        </div>
      </div>

      <header className="space-y-2">
        <span className="label-tag">SANDBOX · RICE</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Boil Rice — <span className="text-brand-primary">Without Burning It</span>
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Watch the water. Drop the heat when it boils. Turn off when it's nearly gone.
        </p>
      </header>

      <DifficultyPicker value={difficulty} onChange={setDifficulty} locked={started && !outcome} />

      {/* CRT */}
      <div data-testid="rice-screen" className="crt p-6 sm:p-8 min-h-[340px] flex items-center justify-center relative">
        <div className="absolute top-3 left-3 right-3 flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <div>
            <div className="text-foreground/40">Phase</div>
            <div data-testid="rice-phase" className={`text-sm ${phaseTone}`}>{phaseLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-foreground/40">Sim Time</div>
            <div data-testid="rice-timer" className="timer-digit text-sm">{fmt(simSec)}</div>
          </div>
        </div>

        <RiceScene water={water} simSec={simSec} heat={heat} outcome={outcome} />

        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-0 right-0 h-1 bg-white/30 animate-scan-line" />
        </div>
      </div>

      {/* Water gauge */}
      <div data-testid="water-gauge" className="brut-card p-4 space-y-2">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-foreground/60">Water Level</span>
          <span className={water > 25 ? "text-foreground" : water > 10 ? "text-brand-primary" : water > 0 ? "text-brand-perfect" : "text-brand-danger"}>{Math.round(water)}%</span>
        </div>
        <div className="h-4 border-2 border-white/80 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              water > 25 ? "bg-brand-perfect" : water > 10 ? "bg-brand-primary" : water > 0 ? "bg-brand-primary" : "bg-brand-danger"
            }`}
            style={{ width: `${water}%` }}
            data-testid="water-bar"
          />
        </div>
      </div>

      {/* Heat controls */}
      <div data-testid="heat-controls" className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">Heat</div>
        <div className="flex gap-2">
          <HeatBtn value="OFF"  label="Off"  tone="bg-white text-ink" />
          <HeatBtn value="LOW"  label="Low"  tone="bg-brand-perfect text-ink" />
          <HeatBtn value="HIGH" label="High" tone="bg-brand-danger text-white" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {!started && !outcome && (
          <button data-testid="ctrl-start" onClick={() => setStarted(true)} className="btn-arcade w-full">
            <Play size={18} /> Light the Hob (HIGH) — Start
          </button>
        )}
        {started && !outcome && (
          <button data-testid="ctrl-done" onClick={onDone} className="btn-arcade w-full">
            Turn it OFF — I'm Done
          </button>
        )}
        {outcome && (
          <div className="space-y-3" data-testid="rice-outcome">
            <div className={`brut-card p-5 space-y-2 ${outcome.key === "disaster" || outcome.key === "scorched" ? "animate-shake-hard" : ""}`}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Result</div>
              <div className={`font-display font-black uppercase text-2xl ${outcome.tone}`} data-testid="rice-outcome-title">{outcome.title}</div>
              <p className="font-mono text-sm text-foreground/80" data-testid="rice-outcome-body">{outcome.body}</p>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 pt-1">
                Ended at {fmt(simSec)} · Water {Math.round(water)}%
              </div>
            </div>
            <button data-testid="ctrl-reset" onClick={reset} className="btn-arcade btn-ghost w-full">
              <RotateCcw size={18} /> Reset & Try Again
            </button>
            <ShareButton sim="rice" title={outcome.title} body={outcome.body} detail={outcome} difficulty={difficulty} />
            <Link to="/recipe/boiled-rice" data-testid="ctrl-read-recipe" className="btn-arcade w-full">
              Read The Real Recipe
            </Link>
          </div>
        )}
      </div>

      {/* Cheat sheet */}
      <section data-testid="rice-cheats" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Rules of the Game</h2>
        <ul className="space-y-2 font-mono text-sm">
          <li className="border-2 border-white/30 p-3 flex items-start gap-2">
            <Flame size={16} className="text-brand-danger flex-none mt-0.5" />
            Start on HIGH. The moment it BOILS (~1:30), switch to LOW.
          </li>
          <li className="border-2 border-white/30 p-3">
            Lid stays on. Water disappears slowly on LOW (good), fast on HIGH (bad).
          </li>
          <li className="border-2 border-white/30 p-3">
            Hit "I'm Done" when water is between 0-10%. Too early = crunchy rice. Too late = welded to the pan.
          </li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- SCENE ---------- */
const RiceScene = ({ water, simSec, heat, outcome }) => {
  const bubbling = simSec >= 90 && water > 5 && heat !== "OFF";
  const burning = outcome?.key === "scorched" || outcome?.key === "disaster" || (water <= 0 && heat !== "OFF");

  return (
    <div className="relative z-10 flex flex-col items-center" data-testid="rice-scene">
      {/* Steam */}
      {bubbling && (
        <div className="flex gap-3 mb-1 opacity-70">
          <span className="smoke" style={{ position: "static", animation: "blink 0.8s infinite" }} />
          <span className="smoke" style={{ position: "static", animation: "blink 0.6s infinite" }} />
          <span className="smoke" style={{ position: "static", animation: "blink 0.9s infinite" }} />
        </div>
      )}

      {/* Saucepan */}
      <div className={`relative ${burning ? "animate-shake-hard" : ""}`} style={{ width: 220, height: 130 }}>
        {/* Handle */}
        <div className="absolute right-[-50px] top-[28px] w-14 h-4 bg-white border-2 border-ink" />
        {/* Pan body */}
        <div className="absolute inset-0 bg-zinc-700 border-[3px] border-white rounded-b-[18px]" style={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
          {/* Water/rice inside */}
          <div className="absolute left-2 right-2 bottom-2 overflow-hidden rounded-b-[14px]" style={{ height: `${Math.max(8, water * 0.9)}%` }}>
            <div className={`absolute inset-0 ${water > 5 ? "bg-blue-300/70" : "bg-zinc-900"} ${bubbling ? "animate-pulse" : ""}`} />
            {/* Rice grains */}
            <div className="absolute left-1 right-1 bottom-0 h-3 bg-yellow-100/80 border-t border-white/50" />
            {water <= 5 && (
              <div className="absolute inset-x-0 bottom-0 h-2 bg-amber-900" />
            )}
          </div>
          {/* Lid suggestion line */}
          <div className="absolute left-0 right-0 top-1 h-1 bg-white/40" />
        </div>

        {/* Flames under */}
        {heat !== "OFF" && (
          <div className="absolute left-0 right-0" style={{ top: "100%" }}>
            <div className="flex justify-center gap-2 mt-1">
              {[...Array(heat === "HIGH" ? 6 : 3)].map((_, i) => (
                <span key={i} className="flame" style={{ position: "static", height: heat === "HIGH" ? 28 : 18 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 font-mono text-[11px] uppercase tracking-widest text-foreground/60 text-center max-w-[260px]">
        {!outcome && simSec < 60 && "Waiting to come up to temperature..."}
        {!outcome && simSec >= 60 && simSec < 90 && "About to boil — get ready."}
        {!outcome && simSec >= 90 && simSec < 150 && heat === "HIGH" && "IT'S BOILING — turn the heat DOWN."}
        {!outcome && simSec >= 90 && heat === "LOW" && water > 10 && "Good. Simmering. Don't touch."}
        {!outcome && water > 0 && water <= 10 && "Water nearly gone — hit DONE."}
        {!outcome && water === 0 && heat !== "OFF" && "WATER GONE — turn the heat OFF NOW!"}
      </div>
    </div>
  );
};
