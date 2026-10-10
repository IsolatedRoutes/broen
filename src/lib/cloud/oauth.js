// ============================================================
// Signing in to Google Drive / Dropbox. No server of ours is involved: the
// person signs in on the company's own page and Broen keeps only a token.
// Dropbox and Google (iPhone app) use the standard "authorization code with
// PKCE" steps. Google on the website uses Google's own sign-in button script,
// which hands back a short-lived token directly.
// ============================================================
import { cloudConfig } from "../../data/cloudConfig";
import { isNativeApp } from "../platform";
import { secretGet, secretRemove, secretSet } from "../secrets";
import { storeGet, storeRemove, storeSet } from "../storage";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const NATIVE_DROPBOX_REDIRECT = "broen://oauth";
const tokenKey = (provider) => "cloudToken_" + provider;

export function nativeGoogleRedirect() {
  const id = cloudConfig().googleIosClientId; // 1234-abc.apps.googleusercontent.com
  const front = id.replace(".apps.googleusercontent.com", "");
  return front ? "com.googleusercontent.apps." + front + ":/oauth2redirect" : "";
}

// Which places can be offered on this device.
export function configuredProviders() {
  const c = cloudConfig();
  const list = [];
  if (isNativeApp() ? c.googleIosClientId : c.googleWebClientId) list.push("google");
  if (c.dropboxAppKey) list.push("dropbox");
  return list;
}

function webRedirect() {
  return window.location.origin + window.location.pathname.replace(/index\.html$/, "");
}

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomString = (n = 48) => b64url(crypto.getRandomValues(new Uint8Array(n))).slice(0, n);
async function challengeFor(verifier) {
  return b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
}

async function saveTokens(provider, t) {
  await secretSet(tokenKey(provider), JSON.stringify(t));
}
export async function loadTokens(provider) {
  try {
    const raw = await secretGet(tokenKey(provider));
    const t = raw ? JSON.parse(raw) : null;
    return t && typeof t === "object" ? t : null;
  } catch {
    return null;
  }
}
export async function signOut(provider) {
  await secretRemove(tokenKey(provider));
}
export async function isConnected(provider) {
  const t = await loadTokens(provider);
  return !!(t && (t.refresh || t.access));
}

async function postForm(url, params) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params).toString() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(res.status === 400 || res.status === 401 ? "RECONNECT" : "NETWORK");
  return json;
}

function authSettings(provider) {
  const c = cloudConfig();
  if (provider === "dropbox") {
    return {
      url: "https://www.dropbox.com/oauth2/authorize",
      token: "https://api.dropboxapi.com/oauth2/token",
      clientId: c.dropboxAppKey,
      redirect: isNativeApp() ? NATIVE_DROPBOX_REDIRECT : webRedirect(),
      extra: { token_access_type: "offline" },
    };
  }
  return {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    clientId: c.googleIosClientId,
    redirect: nativeGoogleRedirect(),
    extra: { scope: GOOGLE_SCOPE, access_type: "offline", prompt: "consent" },
  };
}

// ---- iPhone app: the page opens in the in-app browser and comes back through broen:// ----
function waitForNativeRedirect(prefix) {
  return new Promise((resolve, reject) => {
    let appHandle = null;
    let doneHandle = null;
    let finished = false;
    const end = async (fn, value) => {
      if (finished) return;
      finished = true;
      try { if (appHandle) await appHandle.remove(); } catch { /* ignore */ }
      try { if (doneHandle) await doneHandle.remove(); } catch { /* ignore */ }
      try { (await import("@capacitor/browser")).Browser.close(); } catch { /* ignore */ }
      fn(value);
    };
    (async () => {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");
      appHandle = await App.addListener("appUrlOpen", ({ url }) => {
        if (url && url.startsWith(prefix)) end(resolve, url);
      });
      // Tapping OK/Done on the sign-in page without finishing counts as cancelling.
      doneHandle = await Browser.addListener("browserFinished", () => setTimeout(() => end(reject, new Error("CANCELLED")), 1500));
    })().catch((e) => end(reject, e));
    setTimeout(() => end(reject, new Error("CANCELLED")), 10 * 60 * 1000);
  });
}

async function connectWithCode(provider) {
  const s = authSettings(provider);
  const verifier = randomString(64);
  const state = randomString(24);
  const params = new URLSearchParams({
    client_id: s.clientId,
    redirect_uri: s.redirect,
    response_type: "code",
    code_challenge: await challengeFor(verifier),
    code_challenge_method: "S256",
    state,
    ...s.extra,
  });
  const authUrl = s.url + "?" + params.toString();
  if (isNativeApp()) {
    const waiting = waitForNativeRedirect(s.redirect);
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: authUrl });
    const back = new URL(await waiting);
    const code = back.searchParams.get("code") || "";
    if (back.searchParams.get("state") !== state || !code) throw new Error("CANCELLED");
    await exchangeCode(provider, code, verifier);
    return true;
  }
  // The website: leave for the sign-in page and come back to this address.
  await storeSet("cloudAuthPending", JSON.stringify({ provider, verifier, state, at: Date.now() }));
  window.location.assign(authUrl);
  return false;
}

async function exchangeCode(provider, code, verifier) {
  const s = authSettings(provider);
  const j = await postForm(s.token, { grant_type: "authorization_code", code, code_verifier: verifier, client_id: s.clientId, redirect_uri: s.redirect });
  await saveTokens(provider, { access: j.access_token, refresh: j.refresh_token || "", exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 });
}

// The website, right after coming back from Dropbox: finish signing in.
// Returns the provider that was connected, or null.
export async function completeWebSignIn() {
  if (isNativeApp() || typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (!q.has("code") || !q.has("state")) return null;
  let pending = null;
  try { pending = JSON.parse((await storeGet("cloudAuthPending")) || "null"); } catch { pending = null; }
  const clean = () => window.history.replaceState({}, "", window.location.pathname);
  if (!pending || pending.state !== q.get("state") || Date.now() - pending.at > 15 * 60 * 1000) {
    return null; // not ours; leave the address alone
  }
  const code = q.get("code");
  clean();
  await storeRemove("cloudAuthPending");
  await exchangeCode(pending.provider, code, pending.verifier);
  return pending.provider;
}

// ---- Google on the website: Google's own script gives a short-lived token ----
let gisPromise = null;
function loadGoogleScript() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = "https://accounts.google.com/gsi/client";
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => { gisPromise = null; reject(new Error("NETWORK")); };
      document.head.appendChild(el);
    });
  }
  return gisPromise;
}
async function googleWebToken(interactive) {
  await loadGoogleScript();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: cloudConfig().googleWebClientId,
      scope: GOOGLE_SCOPE,
      callback: (r) => (r && r.access_token ? resolve(r) : reject(new Error("RECONNECT"))),
      error_callback: () => reject(new Error(interactive ? "CANCELLED" : "RECONNECT")),
    });
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
    setTimeout(() => reject(new Error("RECONNECT")), 30000);
  });
}

// Starts signing in. Resolves true when connected, false when the page is
// leaving for the company's sign-in page (the website, Dropbox).
export async function connect(provider) {
  if (provider === "google" && !isNativeApp()) {
    const r = await googleWebToken(true);
    await saveTokens("google", { access: r.access_token, refresh: "", exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 });
    return true;
  }
  return connectWithCode(provider);
}

// A token that is good to use now (renewed quietly when it is about to run out).
export async function accessToken(provider) {
  const t = await loadTokens(provider);
  if (!t) throw new Error("RECONNECT");
  if (t.access && t.exp > Date.now() + 60 * 1000) return t.access;
  if (provider === "google" && !isNativeApp()) {
    const r = await googleWebToken(false);
    await saveTokens("google", { access: r.access_token, refresh: "", exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 });
    return r.access_token;
  }
  if (!t.refresh) throw new Error("RECONNECT");
  const s = authSettings(provider);
  const j = await postForm(s.token, { grant_type: "refresh_token", refresh_token: t.refresh, client_id: s.clientId });
  await saveTokens(provider, { access: j.access_token, refresh: j.refresh_token || t.refresh, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 });
  return j.access_token;
}
