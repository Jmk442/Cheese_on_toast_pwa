/**
 * Share card generator.
 *
 * Builds a 1200x630 PNG with the user's sim result + branded artwork.
 * Uses Web Share API where available, otherwise downloads + copies link to clipboard.
 */

const PALETTE = {
  bg: "#09090B",
  card: "#18181B",
  fg: "#FAFAFA",
  yellow: "#FACC15",
  red: "#EF4444",
  blue: "#3B82F6",
  lime: "#84CC16",
};

const TONE_COLOR = {
  perfect: PALETTE.blue,
  pale: PALETTE.yellow,
  almost: PALETTE.yellow,
  dark: PALETTE.red,
  raw: PALETTE.fg,
  fire: PALETTE.red,
  nuclear: PALETTE.lime,
  scorched: PALETTE.lime,
  burnt: PALETTE.red,
  stuck: PALETTE.red,
  cold: PALETTE.fg,
  lukewarm: PALETTE.yellow,
  undercooked: PALETTE.yellow,
  disaster: PALETTE.lime,
  "didnt-turn-down": PALETTE.red,
};

const SIM_LABEL = {
  cheese: "CHEESE ON TOAST",
  rice: "BOILED RICE",
  pan: "SAUCEPAN HEAT",
};

/**
 * Render the share card to a canvas and return a Blob (PNG).
 */
export async function renderShareCard({ sim, title, body, detail, difficulty }) {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // BG
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle scan-lines effect
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  // Yellow side bar
  ctx.fillStyle = PALETTE.yellow;
  ctx.fillRect(0, 0, 18, H);

  // Top-right corner block
  ctx.fillStyle = PALETTE.yellow;
  ctx.fillRect(W - 220, 40, 180, 40);
  ctx.fillStyle = PALETTE.bg;
  ctx.font = "700 18px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("SANDBOX RESULT", W - 130, 60);

  // Brand
  ctx.fillStyle = PALETTE.yellow;
  ctx.fillRect(60, 50, 36, 36);
  ctx.fillStyle = PALETTE.bg;
  ctx.font = "900 22px 'Unbounded', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("C/T", 78, 70);
  ctx.fillStyle = PALETTE.fg;
  ctx.font = "900 26px 'Unbounded', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CHEESE / TOAST", 110, 72);

  // Sim badge
  ctx.fillStyle = PALETTE.card;
  ctx.strokeStyle = PALETTE.fg;
  ctx.lineWidth = 3;
  ctx.fillRect(60, 120, 380, 46);
  ctx.strokeRect(60, 120, 380, 46);
  ctx.fillStyle = PALETTE.yellow;
  ctx.font = "700 18px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(`SIM · ${SIM_LABEL[sim] || sim.toUpperCase()}`, 76, 143);

  // Difficulty badge
  if (difficulty) {
    const dColor = difficulty === "HARD" ? PALETTE.red : difficulty === "EASY" ? PALETTE.blue : PALETTE.yellow;
    ctx.fillStyle = dColor;
    ctx.fillRect(460, 120, 130, 46);
    ctx.fillStyle = PALETTE.bg;
    ctx.font = "900 18px 'Unbounded', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(difficulty, 525, 143);
    ctx.textAlign = "left";
  }

  // Outcome title — huge
  const tone = TONE_COLOR[String(detail?.key || "perfect").toLowerCase()] || PALETTE.yellow;
  ctx.fillStyle = tone;
  ctx.font = "900 96px 'Unbounded', system-ui, sans-serif";
  ctx.textBaseline = "top";
  // Wrap title if too wide
  const wrapped = wrapText(ctx, title.toUpperCase(), W - 120);
  let y = 210;
  for (const line of wrapped) {
    ctx.fillText(line, 60, y);
    y += 100;
  }

  // Body line
  ctx.fillStyle = PALETTE.fg;
  ctx.font = "500 26px 'IBM Plex Mono', monospace";
  const bodyWrapped = wrapText(ctx, body, W - 120, 50);
  let by = Math.max(y + 10, 430);
  for (const line of bodyWrapped.slice(0, 2)) {
    ctx.fillText(line, 60, by);
    by += 36;
  }

  // Footer URL
  ctx.fillStyle = PALETTE.yellow;
  ctx.fillRect(0, H - 70, W, 70);
  ctx.fillStyle = PALETTE.bg;
  ctx.font = "900 24px 'Unbounded', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("PLAY THE SANDBOX →", 60, H - 35);
  ctx.font = "700 22px 'IBM Plex Mono', monospace";
  ctx.textAlign = "right";
  const url = (typeof window !== "undefined" && window.location?.origin) || "";
  ctx.fillText(url.replace(/^https?:\/\//, ""), W - 60, H - 35);

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}

function wrapText(ctx, text, maxWidth, maxLineCount = 3) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length >= maxLineCount - 1) {
        // Last line absorbs everything else
        const remaining = [w, ...words.slice(words.indexOf(w) + 1)].join(" ");
        lines.push(remaining);
        return lines;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Trigger native share / clipboard / download.
 * Returns "shared" | "downloaded" | "copied" | "cancelled" | "error".
 */
export async function shareResult({ sim, title, body, detail, difficulty, referrerDeviceId }) {
  try {
    const blob = await renderShareCard({ sim, title, body, detail, difficulty });
    if (!blob) return "error";
    const refPart = referrerDeviceId ? `?via=${encodeURIComponent(referrerDeviceId)}` : "";
    const url = `${window.location.origin}/${refPart}`;
    const file = new File([blob], `cheese-on-toast-${sim}-${Date.now()}.png`, { type: "image/png" });

    // 1. Web Share API with file (modern mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `I just played the Cheese on Toast sandbox: ${title}`,
          text: `${body} — try it: ${url}`,
        });
        return "shared";
      } catch (e) {
        if (e.name === "AbortError") return "cancelled";
        // fall through to download
      }
    }

    // 2. Web Share API without file (text only)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cheese on Toast — ${title}`,
          text: body,
          url,
        });
        return "shared";
      } catch (e) {
        if (e.name === "AbortError") return "cancelled";
      }
    }

    // 3. Fallback: download the PNG AND copy URL to clipboard
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
    }
    return "downloaded";
  } catch {
    return "error";
  }
}
