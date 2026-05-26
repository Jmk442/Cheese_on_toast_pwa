import { useState } from "react";
import { Share2, Check, Download } from "lucide-react";
import { shareResult } from "../lib/share";
import { getDeviceId } from "../lib/device";
import { track } from "../lib/analytics";

/**
 * Universal share button. Renders a Canvas PNG of the result and triggers Web Share / download.
 *
 * Props:
 *   sim:        "cheese" | "rice" | "pan"
 *   title:      headline string (e.g. "PERFECT!")
 *   body:       description
 *   detail:     { key: "perfect" | "fire" | ... }
 *   difficulty: "EASY" | "NORMAL" | "HARD"
 *   testid:     optional override
 */
export const ShareButton = ({ sim, title, body, detail, difficulty, testid = "ctrl-share" }) => {
  const [state, setState] = useState("idle"); // idle | sharing | done | downloaded | error

  const handleClick = async () => {
    setState("sharing");
    track("share_clicked", { sim, outcome_key: detail?.key, difficulty });
    const did = getDeviceId();
    const result = await shareResult({ sim, title, body, detail, difficulty, referrerDeviceId: did });
    if (result === "shared") { setState("done"); track("share_completed", { sim, method: "native" }); }
    else if (result === "downloaded") { setState("downloaded"); track("share_completed", { sim, method: "download" }); }
    else if (result === "cancelled") setState("idle");
    else setState("error");
    setTimeout(() => setState("idle"), 3500);
  };

  const label =
    state === "sharing"     ? "Building card..." :
    state === "done"        ? "Shared!" :
    state === "downloaded"  ? "Saved to your phone" :
    state === "error"       ? "Try again" :
    "Share My Result";

  const Icon =
    state === "done"        ? Check :
    state === "downloaded"  ? Download :
                              Share2;

  return (
    <button
      type="button"
      data-testid={testid}
      onClick={handleClick}
      disabled={state === "sharing"}
      className="btn-arcade btn-ghost w-full"
    >
      <Icon size={18} /> {label}
    </button>
  );
};
