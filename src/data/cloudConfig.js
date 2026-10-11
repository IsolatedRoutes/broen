// Sign-in details for cloud sync. These are public identifiers (not secrets),
// created once by the developer when registering Broen with Google and Dropbox.
// Leave a value empty and that place is hidden in the app. Steps: CLOUD_SETUP.md.
export const CLOUD_DEFAULTS = {
  // Google Cloud Console → Credentials. One "Web application" client for the website
  // and one "iOS" client for the iPhone app.
  googleWebClientId: "405639691534-hqeldjtclugdoaphdmnndfraanaqqppk.apps.googleusercontent.com",
  googleIosClientId: "405639691534-r9sjmms39nm9bgsltujllucronrtug66.apps.googleusercontent.com",
  // Dropbox App Console → the app's "App key".
  dropboxAppKey: "tqonm4v2cv6kbd2",
};

// Tests (and only tests) can supply their own values.
export function cloudConfig() {
  const o = typeof window !== "undefined" && window.__BROEN_CLOUD__;
  return o && typeof o === "object" ? { ...CLOUD_DEFAULTS, ...o } : CLOUD_DEFAULTS;
}
