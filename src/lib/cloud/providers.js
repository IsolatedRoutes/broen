// One small file ("broen-sync.json") in a private app folder in the person's own
// Google Drive or Dropbox. Only Broen can see that folder. Reading and writing
// are plain web requests with the person's token.
import { accessToken } from "./oauth";

export const PROVIDER_NAMES = { icloud: "iCloud", google: "Google Drive", dropbox: "Dropbox" };
const FILE = "broen-sync.json";

async function check(res) {
  if (res.ok) return res;
  // Keep Google's or Dropbox's own reason so a setup mistake can be seen.
  let why = "";
  try {
    const j = await res.clone().json();
    why = (j && ((j.error && (j.error.message || j.error.status)) || j.error_summary || j.error_description)) || "";
    if (typeof why !== "string") why = JSON.stringify(why);
  } catch { /* no details */ }
  const busy = res.status === 403 && /rate|quota|limit/i.test(why); // too many requests is not a sign-in problem
  const e = new Error((res.status === 401 || res.status === 403) && !busy ? "RECONNECT" : "NETWORK");
  e.detail = (res.status + (why ? " " + why : "")).slice(0, 140);
  throw e;
}
async function call(url, init) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error("NETWORK");
  }
}

// ---- Google Drive (hidden "appDataFolder") ----
async function driveFindId(token) {
  // If two devices ever each made their own file, every device uses the oldest one, so they end up sharing it.
  const q = encodeURIComponent("name='" + FILE + "'");
  const res = await check(await call("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=createdTime&fields=files(id,createdTime)&q=" + q, { headers: { Authorization: "Bearer " + token } }));
  const j = await res.json();
  return j.files && j.files[0] ? j.files[0].id : null;
}
const google = {
  async read() {
    const token = await accessToken("google");
    const id = await driveFindId(token);
    if (!id) return null;
    const res = await check(await call("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media", { headers: { Authorization: "Bearer " + token } }));
    return res.text();
  },
  async write(text) {
    const token = await accessToken("google");
    const id = await driveFindId(token);
    if (id) {
      await check(await call("https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media", { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: text }));
      return;
    }
    const boundary = "broen" + Math.random().toString(36).slice(2);
    const body =
      "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify({ name: FILE, parents: ["appDataFolder"] }) +
      "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" + text + "\r\n--" + boundary + "--";
    await check(await call("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/related; boundary=" + boundary }, body }));
  },
};

// ---- Dropbox (the app's own folder) ----
const dropbox = {
  async read() {
    const token = await accessToken("dropbox");
    const res = await call("https://content.dropboxapi.com/2/files/download", { method: "POST", headers: { Authorization: "Bearer " + token, "Dropbox-API-Arg": JSON.stringify({ path: "/" + FILE }) } });
    if (res.status === 409) {
      // Only "no such file" means nothing is saved yet; any other 409 must not look like an empty copy.
      const t = await res.text().catch(() => "");
      if (/not_found/.test(t)) return null;
      const e = new Error("NETWORK");
      e.detail = "409 " + t.slice(0, 100);
      throw e;
    }
    return (await check(res)).text();
  },
  async write(text) {
    const token = await accessToken("dropbox");
    await check(await call("https://content.dropboxapi.com/2/files/upload", { method: "POST", headers: { Authorization: "Bearer " + token, "Dropbox-API-Arg": JSON.stringify({ path: "/" + FILE, mode: "overwrite", mute: true }), "Content-Type": "application/octet-stream" }, body: text }));
  },
};

export const CLOUD_PROVIDERS = { google, dropbox };
