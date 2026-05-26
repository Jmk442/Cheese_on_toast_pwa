import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
  baseURL: API,
  timeout: 15000,
});

export const initUser = (device_id, referrer_device_id) =>
  apiClient.post("/users/init", { device_id, referrer_device_id, platform: "web" }).then((r) => r.data);

export const getPremium = (device_id) =>
  apiClient.get(`/users/${device_id}/premium`).then((r) => r.data);

export const createCheckoutSession = (device_id, pkg, origin_url) =>
  apiClient.post("/checkout/session", { device_id, package: pkg, origin_url }).then((r) => r.data);

export const getCheckoutStatus = (session_id) =>
  apiClient.get(`/checkout/status/${session_id}`).then((r) => r.data);

export const postEvent = (device_id, event, properties = {}) =>
  apiClient.post("/analytics/event", { device_id, event, properties }).then((r) => r.data).catch(() => null);

export const getAffiliatePreview = () =>
  apiClient.get("/affiliate/preview").then((r) => r.data);
