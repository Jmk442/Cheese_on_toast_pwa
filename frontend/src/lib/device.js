// Anonymous device-id management — generates and persists a uuid in localStorage.

const DEVICE_KEY = "cot.device_id.v1";
const REFERRER_KEY = "cot.referrer.v1";

const uuid = () => {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  } catch { /* noop */ }
  // Fallback: time + random
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getDeviceId = () => {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return uuid(); // ephemeral if storage blocked
  }
};

/**
 * Capture ?via=DEVICE_ID from URL on first visit and persist it.
 * Returns the referrer device id or null.
 */
export const captureReferrer = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const via = params.get("via");
    if (via && via.length >= 8) {
      const existing = localStorage.getItem(REFERRER_KEY);
      if (!existing) {
        localStorage.setItem(REFERRER_KEY, via);
        return via;
      }
    }
    return localStorage.getItem(REFERRER_KEY);
  } catch {
    return null;
  }
};

export const getReferrer = () => {
  try { return localStorage.getItem(REFERRER_KEY); } catch { return null; }
};
