// Address of Broen's own AI relay (the Cloudflare Worker in server/). Empty =
// "Broen AI" is not offered in the app. Setup steps: CLOUDFLARE_SETUP.md.
export const AI_DEFAULTS = {
  proxyUrl: "",
};

// Tests (and only tests) can supply their own value.
export function aiConfig() {
  const o = typeof window !== "undefined" && window.__BROEN_AI__;
  return o && typeof o === "object" ? { ...AI_DEFAULTS, ...o } : AI_DEFAULTS;
}

export const broenAIEnabled = () => !!aiConfig().proxyUrl;
