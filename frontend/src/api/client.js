// Thin fetch wrapper shared by every api/*.js module.
//
// Security model:
// - The short-lived access token lives only in memory (this module-level
//   variable), never in localStorage/sessionStorage — that would be
//   readable by any injected script, which defeats the point of an
//   httpOnly refresh cookie.
// - The refresh token itself is an httpOnly cookie the browser attaches
//   automatically; JS here never touches it directly.
// - Every state-changing request echoes the readable csrf_token cookie
//   back as a header, so the cookie alone can't be used cross-site.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let accessToken = null;
let unauthorizedHandler = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function readCsrfCookie() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": readCsrfCookie() || "" },
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json?.data?.accessToken) {
      accessToken = json.data.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request(path, { method = "GET", body, isForm = false, retry = true } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (method !== "GET" && method !== "HEAD") {
    const csrf = readCsrfCookie();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // A 401 on any call other than the refresh endpoint itself triggers one
  // silent retry after refreshing — this is what lets a 15-minute access
  // token feel like an "always logged in" session to the user.
  if (res.status === 401 && retry && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { method, body, isForm, retry: false });
    unauthorizedHandler?.();
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const err = new Error(json?.error?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = json?.error?.details;
    throw err;
  }

  return json?.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
};
