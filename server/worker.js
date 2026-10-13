// Broen AI relay: a tiny Cloudflare Worker that sits between the app and
// Anthropic, so people never need their own AI key.
//
// - The Anthropic key lives here as a secret; it never reaches the app.
// - Each install (an anonymous random id) gets a small free allowance.
// - Daily limits per network address and for everyone together keep the
//   worst-case cost fixed, on top of the spending limit set at Anthropic.
// - Nothing people send is stored or logged.
//
// Setup steps for a non-coder: ../CLOUDFLARE_SETUP.md

const DEFAULTS = {
  MODEL: "claude-haiku-4-5-20251001",
  TRIAL_USES: 25, // free AI uses per install, ever
  IP_DAILY: 60, // AI uses per network address per day (stops id farming)
  GLOBAL_DAILY: 400, // AI uses for everyone together per day
  MAX_TOKENS_CAP: 2500,
  ALLOWED_ORIGINS: "https://isolatedroutes.github.io,capacitor://localhost,ionic://localhost,http://localhost",
};

const num = (v, d) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? d : Number(v));
const cfg = (env, k) => (env[k] === undefined || env[k] === "" ? DEFAULTS[k] : env[k]);

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(cfg(env, "ALLOWED_ORIGINS")).split(",").map((s) => s.trim()).filter(Boolean);
  const ok = origin && (allowed.includes(origin) || allowed.includes("*"));
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(request, env) },
  });
}

async function counter(env, name, body) {
  const stub = env.COUNTER.get(env.COUNTER.idFromName(name));
  const res = await stub.fetch("https://counter/", { method: "POST", body: JSON.stringify(body) });
  return res.json();
}

async function shortHash(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_B64 = 7_000_000;

// Returns a cleaned request for Anthropic, or null when it is not acceptable.
export function cleanRequest(body, env) {
  if (!body || typeof body !== "object") return null;
  if (typeof body.device !== "string" || !DEVICE_RE.test(body.device)) return null;
  if (typeof body.system !== "string" || body.system.length > 30000) return null;
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 60) return null;
  let images = 0;
  let chars = body.system.length;
  const messages = [];
  for (const m of body.messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content === "string") {
      chars += m.content.length;
      messages.push({ role: m.role, content: m.content });
      continue;
    }
    if (!Array.isArray(m.content) || m.role !== "user") return null;
    const blocks = [];
    for (const b of m.content) {
      if (b && b.type === "text" && typeof b.text === "string") {
        chars += b.text.length;
        blocks.push({ type: "text", text: b.text });
      } else if (b && b.type === "image" && b.source && b.source.type === "base64" && IMAGE_TYPES.includes(b.source.media_type) && typeof b.source.data === "string" && b.source.data.length <= MAX_IMAGE_B64) {
        images += 1;
        blocks.push({ type: "image", source: { type: "base64", media_type: b.source.media_type, data: b.source.data } });
      } else return null;
    }
    if (!blocks.length) return null;
    messages.push({ role: "user", content: blocks });
  }
  if (images > 1 || chars > 120000) return null;
  if (messages[messages.length - 1].role !== "user") return null;
  const cap = num(cfg(env, "MAX_TOKENS_CAP"), 2500);
  const maxTokens = Math.max(16, Math.min(cap, Math.floor(num(body.maxTokens, 1500))));
  return { device: body.device, system: body.system, messages, maxTokens };
}

export async function handle(request, env, fetchImpl) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

  if (url.pathname === "/health") return json({ ok: true }, 200, request, env);

  if (url.pathname === "/status" && request.method === "GET") {
    const device = url.searchParams.get("device") || "";
    if (!DEVICE_RE.test(device)) return json({ error: "BAD_REQUEST" }, 400, request, env);
    const limit = num(cfg(env, "TRIAL_USES"), DEFAULTS.TRIAL_USES);
    const c = await counter(env, "dev:" + device, { op: "get" });
    return json({ remaining: Math.max(0, limit - (c.n || 0)), limit }, 200, request, env);
  }

  if (url.pathname !== "/ai" || request.method !== "POST") return json({ error: "NOT_FOUND" }, 404, request, env);
  if (env.ENABLED === "0") return json({ error: "PAUSED" }, 503, request, env);
  if (!env.ANTHROPIC_API_KEY) return json({ error: "NOT_CONFIGURED" }, 503, request, env);

  let body;
  try {
    const text = await request.text();
    if (text.length > 9_000_000) return json({ error: "BAD_REQUEST" }, 413, request, env);
    body = JSON.parse(text);
  } catch {
    return json({ error: "BAD_REQUEST" }, 400, request, env);
  }
  const req = cleanRequest(body, env);
  if (!req) return json({ error: "BAD_REQUEST" }, 400, request, env);

  const day = new Date().toISOString().slice(0, 10);
  const ip = await shortHash(request.headers.get("CF-Connecting-IP") || "unknown");
  const trial = num(cfg(env, "TRIAL_USES"), DEFAULTS.TRIAL_USES);
  const taken = []; // counters to give back if the AI call fails

  // Cheapest, most specific check first.
  const dev = await counter(env, "dev:" + req.device, { op: "take", limit: trial });
  if (!dev.ok) return json({ error: "TRIAL_USED", remaining: 0, limit: trial }, 429, request, env);
  taken.push("dev:" + req.device);
  const ipc = await counter(env, "ip:" + ip + ":" + day, { op: "take", limit: num(cfg(env, "IP_DAILY"), DEFAULTS.IP_DAILY), ttl: 172800 });
  if (!ipc.ok) {
    await counter(env, "dev:" + req.device, { op: "give" });
    return json({ error: "BUSY" }, 429, request, env);
  }
  taken.push("ip:" + ip + ":" + day);
  const glob = await counter(env, "all:" + day, { op: "take", limit: num(cfg(env, "GLOBAL_DAILY"), DEFAULTS.GLOBAL_DAILY), ttl: 172800 });
  if (!glob.ok) {
    for (const n of taken) await counter(env, n, { op: "give" });
    return json({ error: "BUSY" }, 429, request, env);
  }
  taken.push("all:" + day);

  const giveBack = async () => {
    for (const n of taken) await counter(env, n, { op: "give" });
  };

  let upstream;
  try {
    upstream = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: cfg(env, "MODEL"), max_tokens: req.maxTokens, system: req.system, messages: req.messages }),
    });
  } catch {
    await giveBack();
    return json({ error: "UPSTREAM" }, 502, request, env);
  }
  let data = null;
  try {
    data = await upstream.json();
  } catch {}
  const reply = data && Array.isArray(data.content) ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n") : "";
  if (!upstream.ok || !reply.trim()) {
    await giveBack();
    return json({ error: "UPSTREAM" }, 502, request, env);
  }
  return json({ text: reply, remaining: Math.max(0, trial - dev.n), limit: trial }, 200, request, env);
}

// One counter per name (device, network address and day, or everyone and day).
// Durable Objects run one request at a time, so counts can't be skipped.
export class Counter {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const b = await request.json();
    const n = (await this.state.storage.get("n")) || 0;
    if (b.op === "get") return Response.json({ n });
    if (b.op === "give") {
      const next = Math.max(0, n - 1);
      await this.state.storage.put("n", next);
      return Response.json({ n: next });
    }
    if (n >= b.limit) return Response.json({ ok: false, n });
    await this.state.storage.put("n", n + 1);
    if (b.ttl && n === 0) await this.state.storage.setAlarm(Date.now() + b.ttl * 1000);
    return Response.json({ ok: true, n: n + 1 });
  }
  async alarm() {
    await this.state.storage.deleteAll();
  }
}

export default {
  fetch(request, env) {
    return handle(request, env, fetch);
  },
};
