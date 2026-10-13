// Broen AI relay (server/worker.js): allowances, limits, safety, with a pretend
// Anthropic and pretend counters.   node tests/worker_check.mjs
import { handle, Counter, cleanRequest } from "../server/worker.js";

let failures = 0;
const check = (ok, msg) => { console.log((ok ? "PASS  " : "FAIL  ") + msg); if (!ok) failures++; };

function makeEnv(extra = {}) {
  const stores = new Map();
  const mk = (name) => {
    if (!stores.has(name)) {
      const m = new Map();
      const state = { storage: { get: async (k) => m.get(k), put: async (k, v) => { m.set(k, v); }, setAlarm: async () => {}, deleteAll: async () => m.clear() } };
      stores.set(name, new Counter(state));
    }
    return stores.get(name);
  };
  return {
    ANTHROPIC_API_KEY: "sk-secret",
    COUNTER: { idFromName: (n) => n, get: (id) => ({ fetch: (url, init) => mk(id).fetch(new Request(url, init)) }) },
    ...extra,
  };
}
let upstreamCalls = [];
let upstreamMode = "ok";
const fakeFetch = async (url, init) => {
  upstreamCalls.push({ url, init });
  if (upstreamMode === "fail") return new Response("{}", { status: 500 });
  if (upstreamMode === "throw") throw new Error("down");
  return new Response(JSON.stringify({ content: [{ type: "text", text: "Hej!" }] }), { status: 200 });
};
const post = (env, body, headers = {}) =>
  handle(new Request("https://x/ai", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": "1.1.1.1", Origin: "https://isolatedroutes.github.io", ...headers }, body: JSON.stringify(body) }), env, fakeFetch);
const good = (device = "device-aaaa-1111") => ({ device, system: "S", messages: [{ role: "user", content: "hi" }], maxTokens: 100 });

let env = makeEnv({ TRIAL_USES: "3" });
let r = await post(env, good());
let j = await r.json();
check(r.status === 200 && j.text === "Hej!" && j.remaining === 2, "a good request is answered and the allowance counts down");
check(upstreamCalls[0].init.headers["x-api-key"] === "sk-secret" && !JSON.stringify(j).includes("sk-secret"), "the key is sent to Anthropic and never back to the app");
check(JSON.parse(upstreamCalls[0].init.body).model.startsWith("claude-haiku"), "uses the cheaper model by default");
check(r.headers.get("Access-Control-Allow-Origin") === "https://isolatedroutes.github.io", "the website is allowed to call it");

await post(env, good()); await post(env, good());
r = await post(env, good()); j = await r.json();
check(r.status === 429 && j.error === "TRIAL_USED", "the 4th use on one install is turned down (trial of 3)");
r = await post(env, good("another-device-22")); 
check(r.status === 200, "a different install has its own allowance");

r = await handle(new Request("https://x/status?device=device-aaaa-1111"), env, fakeFetch); j = await r.json();
check(j.remaining === 0 && j.limit === 3, "status shows what is left");

// bad input
env = makeEnv();
for (const [label, body] of [["no device", { ...good(), device: "" }], ["short device", { ...good(), device: "abc" }], ["no messages", { ...good(), messages: [] }], ["assistant last", { ...good(), messages: [{ role: "assistant", content: "x" }] }], ["huge system", { ...good(), system: "x".repeat(40000) }], ["two images", { ...good(), messages: [{ role: "user", content: [1, 2].map(() => ({ type: "image", source: { type: "base64", media_type: "image/png", data: "AAAA" } })) }] }], ["odd block", { ...good(), messages: [{ role: "user", content: [{ type: "tool_use" }] }] }]]) {
  r = await post(env, body);
  check(r.status === 400, "turned down: " + label);
}
check(upstreamCalls.length === 4, "turned-down requests never reach Anthropic (no cost)");

// image is allowed (one)
r = await post(env, { ...good(), messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } }, { type: "text", text: "read" }] }] });
check(r.status === 200, "one photo plus text is accepted");

// max tokens capped
upstreamCalls = [];
await post(env, { ...good("capdevice-9999"), maxTokens: 999999 });
check(JSON.parse(upstreamCalls[0].init.body).max_tokens === 2500, "reply length is capped");

// failure gives the use back
env = makeEnv({ TRIAL_USES: "2" });
upstreamMode = "fail";
r = await post(env, good()); check(r.status === 502, "an Anthropic failure is reported");
upstreamMode = "throw";
r = await post(env, good()); check(r.status === 502, "a network failure is reported");
upstreamMode = "ok";
r = await post(env, good()); j = await r.json();
check(r.status === 200 && j.remaining === 1, "failed tries did not use up the allowance");

// network address and global limits
env = makeEnv({ IP_DAILY: "2" });
await post(env, good("ipdevice-0001")); await post(env, good("ipdevice-0002"));
r = await post(env, good("ipdevice-0003")); j = await r.json();
check(r.status === 429 && j.error === "BUSY", "one network address can't farm new installs past its daily limit");
r = await handle(new Request("https://x/status?device=ipdevice-0003"), env, fakeFetch); j = await r.json();
check(j.remaining === 25, "a turned-away request did not use that install's allowance");
env = makeEnv({ GLOBAL_DAILY: "2" });
await post(env, good("glob-device-01"), { "CF-Connecting-IP": "2.2.2.2" }); await post(env, good("glob-device-02"), { "CF-Connecting-IP": "3.3.3.3" });
r = await post(env, good("glob-device-03"), { "CF-Connecting-IP": "4.4.4.4" }); j = await r.json();
check(r.status === 429 && j.error === "BUSY", "the whole-service daily cap stops everyone when reached");

// switches
r = await post(makeEnv({ ENABLED: "0" }), good()); check(r.status === 503, "the pause switch turns it off");
r = await post(makeEnv({ ANTHROPIC_API_KEY: "" }), good()); check(r.status === 503, "no key set means it says so instead of failing oddly");
r = await handle(new Request("https://x/ai", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), makeEnv(), fakeFetch);
check(r.headers.get("Access-Control-Allow-Origin") !== "https://evil.example", "other websites are not allowed");
r = await handle(new Request("https://x/other"), makeEnv(), fakeFetch); check(r.status === 404, "unknown addresses are 404");
check(cleanRequest(null, {}) === null, "empty body is rejected");

console.log(failures ? "FAILED: " + failures : "ALL PASSED");
process.exit(failures ? 1 : 0);
