import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { SeoHead } from "../components/SeoHead";

/**
 * Saucepan Stir Meter Simulator
 *
 * Mechanic:
 *   - Food in cold pan. Pick heat: LOW | MED | HIGH (recipe wants MED).
 *   - "Stick meter" rises continuously. Each STIR resets it to 0.
 *   - If stick meter hits 100 -> bottom is sticking; if it stays at 100 for 1s -> BURNT.
 *   - Temperature rises with heat. Reach 100% temp without burning -> hot enough.
 *   - Tap DONE when temp >= 80% to serve. Too early -> lukewarm. Too late -> burnt.
 *
 * Heat tuning:
 *   LOW  -> +0.6 temp/s, stick +6/s
 *   MED  -> +1.6 temp/s, stick +12/s   (sweet spot)
 *   HIGH -> +3.2 temp/s, stick +28/s   (sticks fast, burns easy)
 */

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

const TICK = 200; // ms

export default function SaucepanSimulator() {
  const [started, setStarted] = useState(false);
  const [heat, setHeat] = useState("MED"); // LOW | MED | HIGH
  const [temp, setTemp] = useState(0);
  const [stick, setStick] = useState(0);
  const [stuckTimer, setStuckTimer] = useState(0); // ms at 100 stick
  const [stirCount, setStirCount] = useState(0);
  const [missedStirs, setMissedStirs] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [muted, setMuted] = useState(false);

  const intRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!started || outcome) return;
    intRef.current = setInterval(() => {
      const dt = TICK / 1000; // seconds
      const cfg =
        heat === "LOW"  ? { temp: 0.6, stick: 6 } :
        heat === "MED"  ? { temp: 1.6, stick: 12 } :
        heat === "HIGH" ? { temp: 3.2, stick: 28 } :
                          { temp: 0,   stick: 0 };

      setTemp((t) => Math.min(120, t + cfg.temp * dt));
      setStick((s) => {
        const ns = Math.min(120, s + cfg.stick * dt);
        return ns;
      });
    }, TICK);
    return () => clearInterval(intRef.current);
  }, [started, outcome, heat]);

  // Track "stuck for too long"
  useEffect(() => {
    if (!started || outcome) return;
    if (stick >= 100) {
      setStuckTimer((t) => {
        const nt = t + TICK;
        if (nt >= 1200) {
          finish("burnt");
        }
        return nt;
      });
      if (stick >= 100 && stick < 102) {
        if (!muted) beep(audioRef, 220, 0.1);
        setMissedStirs((m) => m + 1);
      }
    } else if (stuckTimer > 0) {
      setStuckTimer(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stick, started, outcome]);

  // Overheating disaster
  useEffect(() => {
    if (!started || outcome) return;
    if (temp >= 120) finish("scorched");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temp, started, outcome]);

  const stirNow = () => {
    if (!started || outcome) return;
    setStick(0);
    setStirCount((c) => c + 1);
    if (!muted) beep(audioRef, 1200, 0.06);
  };

  const onDone = () => {
    if (temp < 50) return finish("cold");
    if (temp < 75) return finish("lukewarm");
    if (missedStirs >= 3) return finish("stuck");
    return finish("perfect");
  };

  const finish = (key) => {
    let result;
    if (key === "perfect")   result = { key, title: "PERFECTLY HEATED", body: `Stirred ${stirCount}x. No sticking. Hot enough. Plate it up.`, tone: "text-brand-perfect" };
    else if (key === "cold")    result = { key, title: "STILL COLD",         body: "You called it too early. The middle is freezing. Back in the pan.", tone: "text-foreground/60" };
    else if (key === "lukewarm")result = { key, title: "LUKEWARM",           body: "Barely warm. Edible but sad. Give it another minute next time.", tone: "text-brand-primary" };
    else if (key === "stuck")   result = { key, title: "STUCK BOTTOM",       body: "You stirred but not often enough. The bottom layer is glued to the pan.", tone: "text-brand-danger" };
    else if (key === "burnt")   result = { key, title: "BURNT TO THE PAN",   body: "You forgot to stir. The bottom is carbonised. Bin it.", tone: "text-brand-danger" };
    else if (key === "scorched")result = { key, title: "SCORCHED",           body: "Heat too high for too long. Food's smoking. Pan is a write-off.", tone: "text-brand-toxic" };
    clearInterval(intRef.current);
    setOutcome(result);
    if (!muted) beep(audioRef, key === "perfect" ? 1200 : 220, 0.4);
  };

  const reset = () => {
    clearInterval(intRef.current);
    setStarted(false);
    setHeat("MED");
    setTemp(0);
    setStick(0);
    setStuckTimer(0);
    setStirCount(0);
    setMissedStirs(0);
    setOutcome(null);
  };

  const stickColor =
    stick < 50 ? "bg-brand-perfect" :
    stick < 80 ? "bg-brand-primary" :
    "bg-brand-danger";

  const tempColor =
    temp < 50 ? "bg-white/40" :
    temp < 80 ? "bg-brand-primary" :
    temp < 100 ? "bg-brand-perfect" :
    "bg-brand-danger";

  const HeatBtn = ({ value, label, tone }) => (
    <button
      type="button"
      data-testid={`pan-heat-${value.toLowerCase()}`}
      onClick={() => setHeat(value)}
      className={`flex-1 py-3 px-2 border-2 font-display font-bold uppercase text-xs sm:text-sm transition-colors ${
        heat === value ? `${tone} border-current` : "border-white/30 text-foreground/60 hover:border-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-testid="pan-sim-page" className="space-y-6">
      <SeoHead
        title="Saucepan Sandbox — Heat Food Without Burning It"
        description="Practice heating food in a saucepan. Stir often, keep the heat at medium, don't burn the bottom. Visual stir meter and temperature gauge."
        canonicalPath="/simulator/saucepan-heating"
      />

      <div className="flex items-center justify-between pt-1">
        <Link to="/recipe/saucepan-heating" data-testid="back-link" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary">
          <ArrowLeft size={14} /> Recipe
        </Link>
        <button type="button" data-testid="mute-toggle" onClick={() => setMuted((m) => !m)} className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-foreground/60 hover:text-brand-primary">
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />} {muted ? "Muted" : "Sound on"}
        </button>
      </div>

      <header className="space-y-2">
        <span className="label-tag">SANDBOX · SAUCEPAN</span>
        <h1 className="font-display font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-[0.95]">
          Heat It Up — <span className="text-brand-primary">No Microwave</span>
        </h1>
        <p className="font-mono text-sm text-foreground/70">
          Pick MED. Stir before the stick meter goes red. Pull it when it's hot.
        </p>
      </header>

      {/* CRT */}
      <div data-testid="pan-screen" className="crt p-6 sm:p-8 min-h-[320px] flex items-center justify-center relative">
        <div className="absolute top-3 left-3 right-3 flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <div>
            <div className="text-foreground/40">Stirs</div>
            <div data-testid="pan-stir-count" className="text-brand-primary text-sm timer-digit">{stirCount}</div>
          </div>
          <div className="text-right">
            <div className="text-foreground/40">Heat</div>
            <div className={`text-sm ${heat === "HIGH" ? "text-brand-danger" : heat === "MED" ? "text-brand-primary" : "text-foreground"}`}>{heat}</div>
          </div>
        </div>

        <PanScene temp={temp} stick={stick} heat={heat} outcome={outcome} />

        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute left-0 right-0 h-1 bg-white/30 animate-scan-line" />
        </div>
      </div>

      {/* Stick meter */}
      <div data-testid="stick-meter" className="brut-card p-4 space-y-2">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-foreground/60">Stick Risk</span>
          <span className={stick < 80 ? "text-foreground" : "text-brand-danger animate-blink"}>{Math.round(Math.min(100, stick))}%</span>
        </div>
        <div className="h-4 border-2 border-white/80 relative overflow-hidden">
          <div className={`h-full transition-all duration-100 ${stickColor}`} style={{ width: `${Math.min(100, stick)}%` }} data-testid="stick-bar" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">
          Tap STIR to reset to 0 — before it goes red.
        </div>
      </div>

      {/* Temp gauge */}
      <div data-testid="temp-gauge" className="brut-card p-4 space-y-2">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-foreground/60">Temperature</span>
          <span>{Math.round(Math.min(100, temp))}%</span>
        </div>
        <div className="h-4 border-2 border-white/80 relative overflow-hidden">
          <div className={`h-full transition-all duration-100 ${tempColor}`} style={{ width: `${Math.min(100, temp)}%` }} data-testid="temp-bar" />
          {/* Sweet zone marker 80-100 */}
          <div className="absolute top-0 bottom-0" style={{ left: "80%", right: "0%" }}>
            <div className="h-full border-l-2 border-brand-perfect" />
          </div>
        </div>
      </div>

      {/* Heat controls */}
      <div data-testid="pan-heat-controls" className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">Heat</div>
        <div className="flex gap-2">
          <HeatBtn value="LOW"  label="Low — slow" tone="bg-brand-perfect text-ink" />
          <HeatBtn value="MED"  label="Medium ✓"   tone="bg-brand-primary text-ink" />
          <HeatBtn value="HIGH" label="High — risky" tone="bg-brand-danger text-white" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {!started && !outcome && (
          <button data-testid="ctrl-start" onClick={() => setStarted(true)} className="btn-arcade w-full">
            <Play size={18} /> Cold Pan + Food — Start
          </button>
        )}
        {started && !outcome && (
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="ctrl-stir" onClick={stirNow} className="btn-arcade">
              STIR
            </button>
            <button data-testid="ctrl-done" onClick={onDone} className="btn-arcade btn-ghost">
              I'm Done
            </button>
          </div>
        )}
        {outcome && (
          <div className="space-y-3" data-testid="pan-outcome">
            <div className={`brut-card p-5 space-y-2 ${["burnt","scorched"].includes(outcome.key) ? "animate-shake-hard" : ""}`}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Result</div>
              <div className={`font-display font-black uppercase text-2xl ${outcome.tone}`} data-testid="pan-outcome-title">{outcome.title}</div>
              <p className="font-mono text-sm text-foreground/80" data-testid="pan-outcome-body">{outcome.body}</p>
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 pt-1">
                Stirs: {stirCount} · Missed: {missedStirs} · Temp {Math.round(Math.min(100, temp))}%
              </div>
            </div>
            <button data-testid="ctrl-reset" onClick={reset} className="btn-arcade btn-ghost w-full">
              <RotateCcw size={18} /> Reset & Try Again
            </button>
            <Link to="/recipe/saucepan-heating" data-testid="ctrl-read-recipe" className="btn-arcade w-full">
              Read The Real Recipe
            </Link>
          </div>
        )}
      </div>

      {/* Cheat sheet */}
      <section data-testid="pan-cheats" className="space-y-3">
        <h2 className="font-display font-black uppercase tracking-tight text-xl">Rules of the Game</h2>
        <ul className="space-y-2 font-mono text-sm">
          <li className="border-2 border-white/30 p-3">MEDIUM heat is the right answer. LOW = takes forever. HIGH = burns.</li>
          <li className="border-2 border-white/30 p-3">Tap STIR every time the meter gets close to red. That's the whole job.</li>
          <li className="border-2 border-white/30 p-3">Hit DONE when the temperature bar crosses the blue line (80%+).</li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- SCENE ---------- */
const PanScene = ({ temp, stick, heat, outcome }) => {
  const sizzling = temp > 30 && heat !== "OFF";
  const burning = outcome?.key === "burnt" || outcome?.key === "scorched" || stick >= 100;

  return (
    <div className="relative z-10 flex flex-col items-center" data-testid="pan-scene">
      {/* Steam */}
      {sizzling && (
        <div className="flex gap-3 mb-1 opacity-70">
          <span className="smoke" style={{ position: "static", animation: "blink 0.8s infinite" }} />
          <span className="smoke" style={{ position: "static", animation: "blink 0.6s infinite" }} />
        </div>
      )}

      {/* Saucepan */}
      <div className={`relative ${burning ? "animate-shake-hard" : ""}`} style={{ width: 230, height: 110 }}>
        <div className="absolute right-[-55px] top-[22px] w-16 h-4 bg-white border-2 border-ink" />
        <div className="absolute inset-0 bg-zinc-800 border-[3px] border-white rounded-b-[22px]" style={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
          {/* Food blob */}
          <div className="absolute left-3 right-3 bottom-3 h-12 rounded-full overflow-hidden">
            <div
              className={`absolute inset-0 transition-colors duration-300`}
              style={{
                background:
                  burning ? "#1A0F00" :
                  stick > 70 ? "linear-gradient(180deg, #EF4444 0%, #7C2D12 100%)" :
                  temp > 60 ? "linear-gradient(180deg, #F59E0B 0%, #B45309 100%)" :
                  temp > 30 ? "linear-gradient(180deg, #FBBF24 0%, #D97706 100%)" :
                  "#A1A1AA",
              }}
            />
            {/* Bubbles */}
            {sizzling && (
              <>
                <span className="absolute left-3 top-1 w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                <span className="absolute left-12 top-3 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                <span className="absolute right-6 top-2 w-2 h-2 rounded-full bg-white/70 animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Flames */}
        <div className="absolute left-0 right-0" style={{ top: "100%" }}>
          <div className="flex justify-center gap-2 mt-1">
            {[...Array(heat === "HIGH" ? 6 : heat === "MED" ? 4 : 2)].map((_, i) => (
              <span key={i} className="flame" style={{ position: "static", height: heat === "HIGH" ? 28 : heat === "MED" ? 20 : 14 }} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 font-mono text-[11px] uppercase tracking-widest text-foreground/60 text-center max-w-[280px]">
        {!outcome && temp < 30 && "Pan warming up..."}
        {!outcome && temp >= 30 && temp < 75 && stick < 70 && "Sizzling nicely. Keep stirring."}
        {!outcome && stick >= 70 && stick < 100 && "Stick risk rising — STIR!"}
        {!outcome && stick >= 100 && "STUCK — STIR NOW!"}
        {!outcome && temp >= 75 && stick < 80 && "Hot enough — you can hit DONE."}
      </div>
    </div>
  );
};
