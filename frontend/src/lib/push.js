// Web Push helper — registers the service worker, asks permission,
// subscribes the browser, and pushes the subscription to our backend.

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

export const pushSupported = () => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

const registerSW = async () => {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
};

export const getPushStatus = async () => {
  if (!pushSupported()) return { supported: false, permission: "denied", subscribed: false };
  const reg = await registerSW();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!sub,
  };
};

/**
 * Subscribe the current device to push.
 * Returns the subscription object on success, or throws.
 */
export const subscribeToPush = async (deviceId) => {
  if (!pushSupported()) throw new Error("Notifications not supported on this device.");

  const reg = await registerSW();
  if (!reg) throw new Error("Service worker registration failed.");

  // 1. Ask permission
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notification permission was not granted.");

  // 2. Fetch VAPID public key from backend
  const keyRes = await fetch(`${BACKEND}/api/push/vapid-public-key`);
  if (!keyRes.ok) throw new Error("Push not configured on the server.");
  const { public_key: publicKey } = await keyRes.json();

  // 3. Subscribe with the browser
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Re-send to backend just in case the server lost it
    await fetch(`${BACKEND}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, subscription: existing.toJSON() }),
    });
    return existing;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // 4. Send to backend
  const res = await fetch(`${BACKEND}/api/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, subscription: sub.toJSON() }),
  });
  if (!res.ok) {
    await sub.unsubscribe().catch(() => {});
    throw new Error("Failed to register subscription with the server.");
  }
  return sub;
};

export const unsubscribeFromPush = async (deviceId) => {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) await sub.unsubscribe().catch(() => {});
  await fetch(`${BACKEND}/api/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId }),
  }).catch(() => {});
};

export const sendTestPush = async (deviceId) => {
  const res = await fetch(`${BACKEND}/api/push/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Test push failed.");
  }
  return true;
};
