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

const STRIPE_PAYMENT_LINKS = {
  monthly: "https://buy.stripe.com/test_28E28q1YY4KIf3wgSm1VK00",
  lifetime: "https://buy.stripe.com/test_9B628qbzya524oS8lQ1VK01",
};

const withPaymentTracking = (url, device_id, pkg) => {
  const link = new URL(url);
  if (device_id) link.searchParams.set("client_reference_id", device_id);
  link.searchParams.set("utm_source", "cheese_on_toast");
  link.searchParams.set("utm_medium", "pwa");
  link.searchParams.set("utm_campaign", pkg);
  return link.toString();
};

export const createCheckoutSession = (device_id, pkg, origin_url) =>
  Promise.resolve({
    url: withPaymentTracking(STRIPE_PAYMENT_LINKS[pkg], device_id, pkg),
    session_id: `payment_link_${pkg}`,
  });

export const getCheckoutStatus = (session_id) =>
  apiClient.get(`/checkout/status/${session_id}`).then((r) => r.data);

export const postEvent = (device_id, event, properties = {}) =>
  apiClient.post("/analytics/event", { device_id, event, properties }).then((r) => r.data).catch(() => null);

export const getAffiliatePreview = () =>
  apiClient.get("/affiliate/preview").then((r) => r.data);

export const requestMagicLink = (device_id, email, origin_url) =>
  apiClient.post("/auth/magic-link/request", { device_id, email, origin_url }).then((r) => r.data);

export const verifyMagicLink = (token, device_id) =>
  apiClient.post("/auth/magic-link/verify", { token, device_id }).then((r) => r.data);

export const getAccountMe = (device_id) =>
  apiClient.get(`/account/me?device_id=${encodeURIComponent(device_id)}`).then((r) => r.data);

export const unlinkAccount = (device_id) =>
  apiClient.post("/account/unlink", { device_id }).then((r) => r.data);
