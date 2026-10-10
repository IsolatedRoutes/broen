// The part of the app that keeps the deck in step across devices: choosing
// where to sync (iCloud, Google Drive or Dropbox), syncing when something
// changes, and the one-time offer.
import { useCallback, useEffect, useRef, useState } from "react";
import { completeWebSignIn, configuredProviders, connect, isConnected, signOut } from "./cloud/oauth";
import { PROVIDER_NAMES } from "./cloud/providers";
import { icloudAvailable, icloudDetail, icloudSupported, loadPreSyncCopy, onICloudChange, savePreSyncCopy, syncCloudOnce, syncOnce } from "./icloud";
import { storeGet, storeSet } from "./storage";

const MESSAGES = {
  NO_ICLOUD: "iCloud isn't available. Make sure you're signed in to iCloud, and that iCloud is allowed for Broen in Settings.",
  INCOMPLETE: "Your other device's progress is still arriving. This will finish by itself.",
  TOO_BIG: "Your deck is too large to sync. Nothing was lost; use Export in Backup instead.",
  SAVE_FAILED: "Couldn't save the combined deck. Nothing was lost.",
};
const messageFor = (e, provider) => {
  const code = e && e.message;
  if (code === "RECONNECT") return "Sign in to " + PROVIDER_NAMES[provider] + " again to keep syncing.";
  if (code === "NETWORK") return "Couldn't reach " + (PROVIDER_NAMES[provider] || "the cloud") + ". It will try again.";
  return MESSAGES[code] || "Sync didn't finish. It will try again.";
};

export function useSync({ loaded, cards, categories, cardsRef, categoriesRef, persistCards, persistCategories, replaceAllData }) {
  const cloudOptions = configuredProviders();
  const options = [...(icloudSupported() ? ["icloud"] : []), ...cloudOptions];
  const supported = options.length > 0;
  const [provider, setProvider] = useState("");
  const [signedIn, setSignedIn] = useState({});
  const [status, setStatus] = useState({ state: "idle", message: "", at: 0 });
  const [earlierAt, setEarlierAt] = useState(0);
  const chain = useRef(Promise.resolve());
  const providerRef = useRef("");
  providerRef.current = provider;
  const enabled = provider !== "";

  const runSync = useCallback(() => {
    // One at a time, in order.
    chain.current = chain.current.then(async () => {
      const p = providerRef.current;
      if (!p) return;
      setStatus((s) => ({ ...s, state: "syncing", message: "" }));
      try {
        const deck = { getCards: () => cardsRef.current, getCategories: () => categoriesRef.current, saveCards: persistCards, saveCategories: persistCategories };
        const at = p === "icloud" ? await syncOnce(deck) : await syncCloudOnce(deck, p);
        setStatus({ state: "ok", message: "", at });
      } catch (e) {
        setStatus((s) => ({ state: "error", message: messageFor(e, p), at: s.at }));
        if (e && e.message === "INCOMPLETE") setTimeout(() => providerRef.current && runSync(), 6000);
      }
    });
    return chain.current;
  }, [cardsRef, categoriesRef, persistCards, persistCategories]);

  const refreshSignedIn = useCallback(async () => {
    const next = {};
    for (const p of cloudOptions) next[p] = await isConnected(p);
    setSignedIn(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudOptions.join(",")]);

  // Remember the choice across restarts (older versions only had an iCloud switch).
  useEffect(() => {
    if (!supported) return;
    (async () => {
      let p = (await storeGet("syncProvider")) || "";
      if (!p && (await storeGet("icloudSync")) === "1") p = "icloud";
      if (p && !options.includes(p)) p = "";
      setProvider(p);
      const last = Number(await storeGet(p && p !== "icloud" ? "cloudLastSync" : "icloudLastSync")) || 0;
      if (last) setStatus((s) => ({ ...s, at: last }));
      const copy = await loadPreSyncCopy();
      setEarlierAt(copy ? copy.at : 0);
      await refreshSignedIn();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const turnOn = useCallback(
    async (p) => {
      // A copy of the deck as it is right now, so there's always a way back.
      await savePreSyncCopy(cardsRef.current, categoriesRef.current);
      setEarlierAt(Date.now());
      await storeSet("syncProvider", p);
      await storeSet("icloudSync", p === "icloud" ? "1" : "0");
      providerRef.current = p;
      setProvider(p);
      setStatus((s) => ({ ...s, state: "syncing", message: "" }));
    },
    [cardsRef, categoriesRef]
  );

  // The website, coming back from Dropbox's sign-in page.
  useEffect(() => {
    if (!supported || !loaded) return;
    (async () => {
      try {
        const p = await completeWebSignIn();
        if (p) {
          await refreshSignedIn();
          await turnOn(p);
        }
      } catch (e) {
        setStatus((s) => ({ ...s, state: "error", message: messageFor(e, "dropbox") }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, loaded]);

  // Sync at start, when the app comes back, and (iCloud) when another device saves.
  useEffect(() => {
    if (!supported || !loaded || !provider) return undefined;
    runSync();
    const stop = provider === "icloud" ? onICloudChange(() => runSync()) : () => {};
    const onVisible = () => { if (document.visibilityState === "visible") runSync(); };
    document.addEventListener("visibilitychange", onVisible);
    // Google Drive and Dropbox can't tell us about changes, so look every minute while the app is open.
    const timer = provider === "icloud" ? null : setInterval(() => { if (document.visibilityState === "visible") runSync(); }, 60000);
    return () => {
      stop();
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supported, loaded, provider, runSync]);

  // Share changes made here, a moment after the last one.
  useEffect(() => {
    if (!supported || !loaded || !provider) return undefined;
    const t = setTimeout(() => runSync(), 4000);
    return () => clearTimeout(t);
  }, [supported, loaded, provider, cards, categories, runSync]);

  // A changed setting or chat is shared a moment later too.
  useEffect(() => {
    if (!supported || !loaded || !provider) return undefined;
    let t;
    const onStamped = () => { clearTimeout(t); t = setTimeout(() => runSync(), 4000); };
    window.addEventListener("dansk-key-stamped", onStamped);
    return () => { clearTimeout(t); window.removeEventListener("dansk-key-stamped", onStamped); };
  }, [supported, loaded, provider, runSync]);

  // Picks where to sync: "icloud", "google", "dropbox", or "" for off.
  const choose = useCallback(
    async (p) => {
      if (!p) {
        await storeSet("syncProvider", "");
        await storeSet("icloudSync", "0");
        providerRef.current = "";
        setProvider("");
        setStatus((s) => ({ ...s, state: "idle", message: "" }));
        return true;
      }
      if (p === "icloud") {
        if (!(await icloudAvailable())) {
          setStatus((s) => ({ ...s, state: "error", message: MESSAGES.NO_ICLOUD + (icloudDetail ? " (" + icloudDetail + ")" : "") }));
          return false;
        }
        await turnOn("icloud");
        return true;
      }
      try {
        if (!(await isConnected(p))) {
          const done = await connect(p); // false: the page is leaving for the sign-in page
          if (!done) return false;
        }
        await refreshSignedIn();
        await turnOn(p);
        return true;
      } catch (e) {
        if (!(e && e.message === "CANCELLED")) setStatus((s) => ({ ...s, state: "error", message: messageFor(e, p) }));
        return false;
      }
    },
    [turnOn, refreshSignedIn]
  );

  const signOutOf = useCallback(
    async (p) => {
      await signOut(p);
      if (providerRef.current === p) await choose("");
      await refreshSignedIn();
    },
    [choose, refreshSignedIn]
  );

  const enable = useCallback(() => choose("icloud"), [choose]);
  const disable = useCallback(() => choose(""), [choose]);

  // Puts the deck back as it was just before sync was turned on.
  const goBack = useCallback(async () => {
    const copy = await loadPreSyncCopy();
    if (!copy) return false;
    await choose("");
    return replaceAllData(copy.cards, copy.categories);
  }, [replaceAllData, choose]);

  return { supported, options, provider, signedIn, enabled, status, earlierAt, choose, signOutOf, enable, disable, goBack };
}
