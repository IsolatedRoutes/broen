// One small file ("broen-sync.json") in a private app folder in the person's own
// Google Drive or Dropbox. Only Broen can see that folder. Reading and writing
// are plain web requests with the person's token.
import { accessToken } from "./oauth";

export const PROVIDER_NAMES = { icloud: "iCloud", google: "Google Drive", dropbox: "Dropbox" };
const FILE = "broen-sync.json";

async function check(res) {
  if (res.status === 401) throw new Error("RECONNECT");
  if (!res.ok) throw new Error(res.status === 403 ? "RECONNECT" : "NETWORK");
  return res;
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
  const q = encodeURIComponent("name='" + FILE + "'");
  const res = await check(await call("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id)&q=" + q, { headers: { Authorization: "Bearer " + token } }));
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
    if (res.status === 409) return null; // nothing saved yet
    return (await check(res)).text();
  },
  async write(text) {
    const token = await accessToken("dropbox");
    await check(await call("https://content.dropboxapi.com/2/files/upload", { method: "POST", headers: { Authorization: "Bearer " + token, "Dropbox-API-Arg": JSON.stringify({ path: "/" + FILE, mode: "overwrite", mute: true }), "Content-Type": "application/octet-stream" }, body: text }));
  },
};

export const CLOUD_PROVIDERS = { google, dropbox };
