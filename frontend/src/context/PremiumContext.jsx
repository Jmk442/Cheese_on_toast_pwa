import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDeviceId, captureReferrer } from "../lib/device";
import { initUser, getPremium, createCheckoutSession, getCheckoutStatus } from "../lib/api";
import { track } from "../lib/analytics";

const PremiumContext = createContext(null);

const COSMETIC_KEY = "cot.cosmetic.v1";
const SAVED_KEY = "cot.saved.v1";

export const PremiumProvider = ({ children }) => {
  const [deviceId, setDeviceId] = useState(null);
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cosmetic, setCosmeticState] = useState("yellow");
  const [savedSlugs, setSavedSlugsState] = useState([]);
  const initRef = useRef(false);

  // Load cosmetic + saved from localStorage
  useEffect(() => {
    try {
      const c = localStorage.getItem(COSMETIC_KEY);
      if (c) setCosmeticState(c);
      const s = localStorage.getItem(SAVED_KEY);
      if (s) setSavedSlugsState(JSON.parse(s));
    } catch { /* noop */ }
  }, []);

  // Apply theme attribute on <html> whenever cosmetic changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-cot-theme", cosmetic || "yellow");
    } catch { /* noop */ }
  }, [cosmetic]);

  const setCosmetic = useCallback((name) => {
    setCosmeticState(name);
    try { localStorage.setItem(COSMETIC_KEY, name); } catch { /* noop */ }
    track("cosmetic_changed", { name });
  }, []);

  const toggleSaved = useCallback((slug) => {
    setSavedSlugsState((cur) => {
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* noop */ }
      track("recipe_saved_toggled", { slug, saved: next.includes(slug) });
      return next;
    });
  }, []);

  const refreshPremium = useCallback(async (did = deviceId) => {
    if (!did) return null;
    try {
      const p = await getPremium(did);
      setPremium(p);
      return p;
    } catch {
      return null;
    }
  }, [deviceId]);

  // Init once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const did = getDeviceId();
      setDeviceId(did);
      const referrer = captureReferrer();
      try {
        const u = await initUser(did, referrer);
        setUser(u);
        setPremium(u.premium);
        track("session_start", { referrer: !!referrer });
      } catch (e) {
        // If backend is down, still let app run as free
        setPremium({ is_premium: false, tier: "free" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refresh premium on focus
  useEffect(() => {
    const onFocus = () => { if (deviceId) refreshPremium(deviceId); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [deviceId, refreshPremium]);

  const startCheckout = useCallback(async (pkg) => {
    if (!deviceId) return;
    track("checkout_clicked", { package: pkg });
    try {
      const origin = window.location.origin;
      const { url } = await createCheckoutSession(deviceId, pkg, origin);
      window.location.href = url;
    } catch (e) {
      track("checkout_failed", { package: pkg, error: String(e?.message || e) });
      throw e;
    }
  }, [deviceId]);

  const pollCheckout = useCallback(async (sessionId, onSuccess, onTimeout) => {
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const s = await getCheckoutStatus(sessionId);
        if (s.payment_status === "paid") {
          track("purchase_succeeded", { session_id: sessionId, package: s.package });
          await refreshPremium(deviceId);
          onSuccess?.(s);
          return;
        }
        if (s.status === "expired" || attempts > 8) {
          onTimeout?.(s);
          return;
        }
      } catch { /* keep trying */ }
      setTimeout(tick, 1800);
    };
    tick();
  }, [deviceId, refreshPremium]);

  // Trial countdown helper
  const trialDaysLeft = useMemo(() => {
    if (!premium?.premium_until || premium.is_lifetime) return null;
    try {
      const end = new Date(premium.premium_until);
      const days = (end - new Date()) / (1000 * 60 * 60 * 24);
      return Math.max(0, Math.floor(days));
    } catch { return null; }
  }, [premium]);

  const value = useMemo(() => ({
    deviceId,
    user,
    premium,
    loading,
    isPremium: !!premium?.is_premium,
    isTrial: premium?.tier === "trial",
    isLifetime: !!premium?.is_lifetime,
    trialDaysLeft,
    refreshPremium,
    startCheckout,
    pollCheckout,
    cosmetic,
    setCosmetic,
    savedSlugs,
    toggleSaved,
    track,
  }), [deviceId, user, premium, loading, trialDaysLeft, refreshPremium, startCheckout, pollCheckout, cosmetic, setCosmetic, savedSlugs, toggleSaved]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = () => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
};
