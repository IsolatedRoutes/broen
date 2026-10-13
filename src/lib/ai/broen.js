import { aiConfig } from "../../data/aiConfig";
import { storeGet, storeSet } from "../storage";
import { requireConsent } from "./http";

// "Broen AI": the app asks Broen's own relay, which holds the AI key, so the
// person needs no key. Each install is an anonymous random id with a small
// free allowance. Nothing here is stored beyond that id and the count left.
async function installId() {
  let id = await storeGet("deviceId");
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9_-]/g, "");
    await storeSet("deviceId", id);
  }
  return id;
}

async function post(messages, system, maxTokens) {
  await requireConsent();
  const base = aiConfig().proxyUrl.replace(/\/+$/, "");
  const device = await installId();
  let res;
  try {
    res = await fetch(base + "/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device, system, messages, maxTokens }),
    });
  } catch (e) {
    throw new Error("NETWORK_ERROR: " + (e && e.message ? e.message : e));
  }
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    if (data.error === "TRIAL_USED") throw new Error("BROEN_TRIAL_USED");
    if (data.error === "BUSY") throw new Error("BROEN_BUSY");
    if (data.error === "PAUSED" || data.error === "NOT_CONFIGURED") throw new Error("BROEN_PAUSED");
    throw new Error("BROEN_ERROR");
  }
  if (!data.text || !String(data.text).trim()) throw new Error("RESPONSE_NOT_JSON: (empty response)");
  if (typeof data.remaining === "number") storeSet("broenAIRemaining", String(data.remaining)).catch(() => {});
  return data.text;
}

export function callBroenText(system, userText, opts) {
  const history = (opts && opts.history) || [];
  return post([...history, { role: "user", content: userText }], system, (opts && opts.maxTokens) || 1500);
}

export function callBroenImage(system, userText, base64, mediaType, maxTokens) {
  return post(
    [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: userText }] }],
    system,
    maxTokens || 1500
  );
}

// How many free uses are left, or null when unknown.
export async function broenRemaining() {
  try {
    const base = aiConfig().proxyUrl.replace(/\/+$/, "");
    const device = await installId();
    const res = await fetch(base + "/status?device=" + encodeURIComponent(device));
    if (!res.ok) return null;
    const j = await res.json();
    return typeof j.remaining === "number" ? j : null;
  } catch {
    return null;
  }
}
