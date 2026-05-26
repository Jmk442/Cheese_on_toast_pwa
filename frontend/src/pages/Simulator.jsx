import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Hand, Volume2, VolumeX } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { ASSETS } from "../data/recipes";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { AchievementBanner } from "../components/AchievementBanner";
import { recordOutcome, BADGES } from "../lib/achievements";
import { ShareButton } from "../components/ShareButton";

/**
 * 5-stage cheese-on-toast simulator.
 *  Stage 0: empty       -> CTA: Insert Bread
 *  Stage 1: bread in    -> CTA: Push lever (start toasting)
 *  Stage 2: toasting    -> auto progress (~4s real)
 *  Stage 3: toast out   -> CTA: Apply Cheese
 *  Stage 4: cheese on   -> CTA: Under the Grill (start timer)
 *  Stage 5: grilling    -> live timer with phases (1 real sec = 12 sim sec)
 *  Stage 6: done        -> outcome (perfect / pale / dark / fire / nuclear)
 */

const PHASES = [
  { from: 0,   to: 30,  label: "COLD",          color: "text-foreground/60", advice: "Just starting. Cheese is still cold." },
  { from: 30,  to: 60,  label: "MELTING",       color: "text-brand-primary", advice: "Cheese is melting. Stay close." },
  { from: 60,  to: 120, label: "LOOKING GOOD",  color: "text-brand-primary", advice: "Cheese is bubbling. Don't walk away." },
  { from: 120, to: 180, label: "ABOUT READY",   color: "text-brand-perfect", advice: "Almost there. Get the oven glove." },
  { from: 180, to: 210, label: "TAKE IT OUT!",  color: "text-brand-primary", advice: "PERFECT WINDOW. Tap TAKE IT OUT now." },
  { from: 210, to: 240, label: "GETTING DARK",  color: "text-brand-danger",  advice: "It's going brown-black. Pull it!" },
  { from: 240, to: 300, label: "FIRE",          color: "text-brand-danger",  advice: "The grill is on fire. Disaster." },
  { from: 300, to: 9999,label: "NUCLEAR",       color: "text-brand-toxic",   advice: "You forgot. Mushroom cloud incoming." },
];

const getPhase = (sec) => PHASES.find((p) => sec >= p.from && sec < p.to);

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
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (_e) {
    // ignore
  }
};

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export default function Simulator() {
  const [stage, setStage] = useState(0);
  const [simSec, setSimSec] = useState(0); // simulated seconds 0..300+
  const [toasting, setToasting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState("NORMAL");
  const [newBadges, setNewBadges] = useState([]);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Difficulty scaling on the grill — HARD narrows perfect window, EASY widens it.
  const diffRate = difficulty === "HARD" ? 1.4 : difficulty === "EASY" ? 0.75 : 1.0;

  // Grill timer
  useEffect(() => {
    if (stage !== 5) return;
    intervalRef.current = setInterval(() => {
      setSimSec((s) => {
        const next = s + 6; // 6 sim seconds per 250ms tick = 24 sim-sec/sec
        if (!muted && Math.floor(next / 30) !== Math.floor(s / 30)) {
          beep(audioCtxRef, 660, 0.05);
        }
        if (next >= 360) {
          // nuclear cap
          clearInterval(intervalRef.current);
          finish(next);
        }
        return next;
      });
    }, 250);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, muted]);

  // Toaster auto-progress
  useEffect(() => {
    if (stage !== 2) return;
    setToasting(true);
    const t = setTimeout(() => {
      setToasting(false);
      setStage(3);
      if (!muted) beep(audioCtxRef, 1200, 0.15);
    }, 4000);
    return () => clearTimeout(t);
  }, [stage, muted]);

  const finish = (atSec) => {
    let result;
    // HARD difficulty narrows the perfect window: 150-200 instead of 120-210
    // EASY widens it: 90-240
    const easy = difficulty === "EASY";
    const hard = difficulty === "HARD";
    const perfLo = easy ? 90  : hard ? 150 : 120;
    const perfHi = easy ? 240 : hard ? 200 : 210;
    if (atSec < 60) result = { key: "raw",     title: "BARELY MELTED",    body: "You pulled it too early. The cheese is sweaty, not melted.", tone: "text-foreground/60" };
    else if (atSec < perfLo) result = { key: "pale", title: "A BIT PALE",     body: "Edible, but no colour. Give it another minute next time.", tone: "text-brand-primary" };
    else if (atSec < perfHi) result = { key: "perfect", title: "PERFECT!",    body: "Golden, bubbling, exactly right. You did it.",              tone: "text-brand-perfect" };
    else if (atSec < 240) result = { key: "dark",  title: "A BIT DARK",    body: "Still edible. The crusts are crunchy. Lessons learned.",   tone: "text-brand-danger" };
    else if (atSec < 300) result = { key: "fire",  title: "ON FIRE",       body: "The grill is on fire. Turn it OFF. Stand back. No water on a fat fire.", tone: "text-brand-danger", img: ASSETS.fireFail };
    else result = { key: "nuclear", title: "NUCLEAR EXPLOSION",            body: "You walked away. The kitchen is gone. The dog hates you.",  tone: "text-brand-toxic", img: ASSETS.nukeFail };
    setOutcome(result);
    setStage(6);
    if (!muted) {
      beep(audioCtxRef, result.key === "perfect" ? 1200 : 220, 0.4);
    }
    // record + check for new badges
    const unlocked = recordOutcome("cheese", result.key, difficulty);
    if (unlocked.length > 0) {
      setNewBadges(BADGES.filter((b) => unlocked.includes(b.id)));
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setStage(0);
    setSimSec(0);
    setOutcome(null);
    setToasting(false);
    setNewBadges([]);
  };

  const phase = stage === 5 ? getPhase(simSec) : null;

  return (
    <div data-testid="simulator-page" className="space-y-6">
      <AchievementBanner badges={newBadges} onClose={() => setNewBadges([])} />
      <SeoHead
        title="Cheese on Toast Sandbox — Practice the Recipe"
        description="Visual oven sandbox: practice making cheese on toast before you cook for real. Bread → toaster → cheese → grill. Time it right, or watch it explode."
        canonicalPath="/simulator"
      />

      <div className="flex items-center justify-between pt-1">
        <Link
          to="/"
          data-testid="back-home-link"
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Home
        </Link>
        <button
          data-testid="mute-toggle"
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? "Muted" : "Sound on"}
        </button>
      </div>

      <header className="space-y-2">
        <span className="label-tag">SANDBOX MODE · NO REAL FOOD</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Cheese on Toast — <span className="text-brand-primary">Practice Run</span>
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Get the timing right before you try it in the real kitchen.
        </p>
      </header>

      <DifficultyPicker value={difficulty} onChange={setDifficulty} locked={stage > 0 && stage < 6} />

      {/* CRT SCREEN */}
      <div data-testid="sim-screen" className="crt p-6 sm:p-10 min-h-[340px] sm:min-h-[400px] flex items-center justify-center relative">
        {/* HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between text-[10px] font-mono uppercase tracking-widest">
          <div className="space-y-0.5">
            <div className="text-foreground/40">Stage</div>
            <div data-testid="hud-stage" className="text-brand-primary text-sm">{stage}/6</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-foreground/40">Grill Timer</div>
            <div data-testid="hud-timer" className={`text-sm timer-digit ${phase?.color || "text-foreground"}`}>
              {fmt(simSec)}
            </div>
          </div>
        </div>

        <SceneRenderer stage={stage} simSec={simSec} toasting={toasting} outcome={outcome} />

        {/* Scan line */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-0 right-0 h-1 bg-white/30 animate-scan-line" />
        </div>
      </div>

      {/* PHASE READOUT (during grill) */}
      {stage === 5 && phase && (
        <div data-testid="phase-readout" className="brut-card p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Status</div>
            <div className={`font-display font-black uppercase text-xl ${phase.color}`}>{phase.label}</div>
            <div className="font-mono text-xs text-foreground/70">{phase.advice}</div>
          </div>
          <div className={`timer-digit text-3xl sm:text-4xl font-display font-black ${phase.color}`}>{fmt(simSec)}</div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="space-y-3">
        {stage === 0 && (
          <button data-testid="ctrl-insert-bread" onClick={() => setStage(1)} className="btn-arcade w-full">
            <Hand size={18} /> Put Bread In Toaster
          </button>
        )}
        {stage === 1 && (
          <button data-testid="ctrl-toast" onClick={() => setStage(2)} className="btn-arcade w-full">
            <Play size={18} /> Push Lever — Toast It
          </button>
        )}
        {stage === 2 && (
          <button data-testid="ctrl-toasting" disabled className="btn-arcade w-full opacity-60 cursor-wait">
            Toasting... bread stays IN the toaster
          </button>
        )}
        {stage === 3 && (
          <button data-testid="ctrl-cheese" onClick={() => setStage(4)} className="btn-arcade w-full">
            Take Toast Out + Apply Cheese
          </button>
        )}
        {stage === 4 && (
          <button data-testid="ctrl-grill" onClick={() => { setStage(5); setSimSec(0); }} className="btn-arcade w-full">
            <Play size={18} /> Put Under Grill — Start Timer
          </button>
        )}
        {stage === 5 && (
          <button data-testid="ctrl-take-out" onClick={() => finish(simSec)} className="btn-arcade btn-danger w-full text-base sm:text-lg animate-blink">
            TAKE IT OUT NOW!
          </button>
        )}
        {stage === 6 && outcome && (
          <div className="space-y-3" data-testid="outcome">
            <div className={`brut-card p-5 space-y-3 ${outcome.key === "nuclear" || outcome.key === "fire" ? "animate-shake-hard" : ""}`}>
              {outcome.img && (
                <img src={outcome.img} alt={outcome.title} className="w-full h-48 object-cover border-2 border-white/90" data-testid="outcome-image" />
              )}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Result</div>
                <div className={`font-display font-black uppercase text-2xl ${outcome.tone}`} data-testid="outcome-title">{outcome.title}</div>
                <p className="font-mono text-sm text-foreground/80" data-testid="outcome-body">{outcome.body}</p>
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 pt-2">
                  Pulled at {fmt(simSec)} sim time
                </div>
              </div>
            </div>
            <button data-testid="ctrl-reset" onClick={reset} className="btn-arcade btn-ghost w-full">
              <RotateCcw size={18} /> Reset & Try Again
            </button>
            <ShareButton sim="cheese" title={outcome.title} body={outcome.body} detail={outcome} difficulty={difficulty} />
            <Link to="/recipe/cheese-on-toast" data-testid="ctrl-read-recipe" className="btn-arcade w-full">
              Ready? Read The Real Recipe
            </Link>
          </div>
        )}
      </div>

      {/* TIMING GUIDE */}
      <section data-testid="timing-guide" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Timing Cheat Sheet</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { t: "0:00", l: "Cold cheese", c: "border-white/30" },
            { t: "1:00", l: "Melting", c: "border-brand-primary text-brand-primary" },
            { t: "2:00", l: "Looking good", c: "border-brand-primary text-brand-primary" },
            { t: "3:00", l: "About ready", c: "border-brand-perfect text-brand-perfect" },
            { t: "3:30", l: "TAKE IT OUT", c: "border-brand-primary text-brand-primary" },
            { t: "4:00+", l: "Burning", c: "border-brand-danger text-brand-danger" },
            { t: "5:00+", l: "Fire", c: "border-brand-danger text-brand-danger" },
            { t: "6:00+", l: "Nuclear", c: "border-brand-toxic text-brand-toxic" },
          ].map((row) => (
            <div key={row.t} className={`border-2 p-2 font-mono text-xs flex justify-between ${row.c}`}>
              <span className="timer-digit">{row.t}</span>
              <span className="uppercase tracking-widest">{row.l}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- SCENE ---------------- */
const SceneRenderer = ({ stage, simSec, toasting, outcome }) => {
  if (stage === 6 && outcome && (outcome.key === "fire" || outcome.key === "nuclear")) {
    return (
      <div className="text-center space-y-2 z-10">
        <div className={`font-display font-black uppercase ${outcome.key === "nuclear" ? "text-brand-toxic text-5xl" : "text-brand-danger text-4xl"} animate-shake-hard`}>
          {outcome.key === "nuclear" ? "☢ NUCLEAR ☢" : "🔥 FIRE 🔥"}
        </div>
        <div className="font-mono text-xs text-foreground/70">RESET REQUIRED</div>
      </div>
    );
  }

  // Toaster phases
  if (stage <= 3) {
    return (
      <div className="relative flex flex-col items-center z-10" data-testid="scene-toaster">
        <div className="toaster-shell">
          <div className="toaster-slot" />
          <div className={`toaster-lever ${stage === 2 ? "down" : ""}`} />
          <div className="toaster-knob" />
          <div className="toaster-feet"><span/><span/></div>

          {/* Bread inside */}
          {stage === 1 && (
            <div className="absolute" style={{ top: -42, left: 55, width: 110, height: 60 }}>
              <div className="bread" style={{ height: 60 }} />
            </div>
          )}
          {stage === 2 && (
            <div className="absolute animate-pulse" style={{ top: -10, left: 55, width: 110, height: 30, overflow: "hidden" }}>
              <div className="bread toasted" style={{ height: 60, transform: "translateY(-30px)" }} />
            </div>
          )}
          {stage === 3 && (
            <div className="absolute animate-pop-out" style={{ top: -52, left: 55, width: 110, height: 60 }}>
              <div className="bread toasted" />
            </div>
          )}
        </div>
        <div className="mt-6 font-mono text-[11px] uppercase tracking-widest text-foreground/50">
          {stage === 0 && "Step 1 — empty toaster"}
          {stage === 1 && "Step 2 — bread inserted"}
          {stage === 2 && (toasting ? "Toasting..." : "")}
          {stage === 3 && "Toast popped out — take it OUT of the toaster"}
        </div>
      </div>
    );
  }

  // Cheese-on-toast on tray under grill
  let cheeseClass = "cheese";
  if (stage === 5) {
    if (simSec > 30 && simSec <= 120) cheeseClass = "cheese melt";
    else if (simSec > 120 && simSec <= 210) cheeseClass = "cheese golden";
    else if (simSec > 210 && simSec <= 240) cheeseClass = "cheese dark";
    else if (simSec > 240) cheeseClass = "cheese burnt";
  } else if (stage === 6 && outcome) {
    if (outcome.key === "perfect") cheeseClass = "cheese golden";
    else if (outcome.key === "dark") cheeseClass = "cheese dark";
    else if (outcome.key === "pale") cheeseClass = "cheese melt";
    else cheeseClass = "cheese";
  }

  const showFlames = stage === 5 && simSec > 240;
  const showSmoke = stage === 5 && simSec > 180 && simSec <= 240;

  return (
    <div className="relative flex flex-col items-center z-10" data-testid="scene-toast">
      {/* Grill bars at top during grilling */}
      {stage >= 4 && (
        <div className="absolute top-0 left-0 right-0 flex justify-around opacity-70">
          {[...Array(6)].map((_, i) => (
            <span key={i} className={`block w-6 h-1 ${stage === 5 && simSec > 60 ? "bg-brand-danger" : "bg-foreground/40"}`} />
          ))}
        </div>
      )}

      <div className={`relative ${stage === 5 && simSec > 210 ? "animate-shake-hard" : ""}`}>
        <div className="bread toasted" style={{ width: 160, height: 110 }}>
          <div className={cheeseClass} />
        </div>

        {showSmoke && (
          <>
            <span className="smoke" style={{ left: "20%", animation: "blink 0.6s infinite" }} />
            <span className="smoke" style={{ left: "50%", animation: "blink 0.7s infinite" }} />
            <span className="smoke" style={{ left: "80%", animation: "blink 0.5s infinite" }} />
          </>
        )}
        {showFlames && (
          <>
            <span className="flame" style={{ left: "15%" }} />
            <span className="flame" style={{ left: "35%", height: 32 }} />
            <span className="flame" style={{ left: "55%", height: 28 }} />
            <span className="flame" style={{ left: "75%" }} />
          </>
        )}
      </div>

      <div className="mt-6 font-mono text-[11px] uppercase tracking-widest text-foreground/50 text-center">
        {stage === 4 && "Cheese on toast — ready for the grill"}
        {stage === 5 && "Under the grill — WATCH IT"}
        {stage === 6 && outcome && `Result: ${outcome.title}`}
      </div>
    </div>
  );
};
