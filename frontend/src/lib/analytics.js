// Lightweight analytics — posts events to backend, queues offline.

import { postEvent } from "./api";
import { getDeviceId } from "./device";

const QUEUE_KEY = "cot.evt_queue.v1";
const MAX_QUEUE = 50;

const enqueue = (event, properties) => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ event, properties, ts: Date.now() });
    while (arr.length > MAX_QUEUE) arr.shift();
    localStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  } catch { /* noop */ }
};

const drain = async () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!arr.length) return;
    localStorage.setItem(QUEUE_KEY, "[]");
    const did = getDeviceId();
    for (const item of arr) {
      try { await postEvent(did, item.event, item.properties); } catch { /* noop */ }
    }
  } catch { /* noop */ }
};

let _draining = false;
export const track = (event, properties = {}) => {
  const did = getDeviceId();
  if (typeof window !== "undefined" && window.console) {
    // Helpful for dev — small log
    // eslint-disable-next-line no-console
    console.debug("[track]", event, properties);
  }
  postEvent(did, event, properties)
    .then((r) => {
      if (!r) enqueue(event, properties);
    })
    .catch(() => enqueue(event, properties));
  if (!_draining) {
    _draining = true;
    setTimeout(() => { drain().finally(() => { _draining = false; }); }, 1500);
  }
};
