import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/icons";
import { CenteredOverlay, smallBtn } from "../components/ui";
import { PROVIDER_NAMES } from "../lib/cloud/providers";
import { BACKUP_SETTING_KEYS, performBackupExport } from "../lib/backup";
import { isNativeApp } from "../lib/platform";
import { storeGet, storeSet } from "../lib/storage";

export function BackupPanel({ cards, categories, replaceAllData, sync, showToast, onClose }) {
  const importInputRef = useRef(null);
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);

  useEffect(() => {
    storeGet("autoBackupEnabled").then((v) => setAutoBackupEnabledState(v === "true"));
  }, []);

  async function toggleAutoBackup(next) {
    setAutoBackupEnabledState(next);
    await storeSet("autoBackupEnabled", next ? "true" : "false");
  }

  function exportDeck() {
    return performBackupExport(cards, categories, showToast);
  }

  async function processImportedBackup(text) {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.cards) || !Array.isArray(parsed.categories)) {
        showToast("That doesn't look like a Dansk backup file");
        return;
      }
      const confirmed = window.confirm
        ? window.confirm("This replaces everything currently in your deck (" + cards.length + " cards) with the " + parsed.cards.length + " cards from this backup. Continue?")
        : true;
      if (!confirmed) return;
      if (parsed.settings && typeof parsed.settings === "object") {
        for (const key of BACKUP_SETTING_KEYS) {
          if (typeof parsed.settings[key] === "string") await storeSet(key, parsed.settings[key]);
        }
      }
      const ok = await replaceAllData(parsed.cards, parsed.categories);
      showToast(ok ? "Backup restored (" + parsed.cards.length + " cards)" : "Couldn't restore the backup");
    } catch {
      showToast("Couldn't read that file — is it a Dansk backup?");
    }
  }

  async function triggerImport() {
    // On desktop Chrome/Edge, open straight into the same remembered
    // folder Export uses (same id) — no manual navigation needed once
    // it's been picked there once.
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          id: "dansk-cloud-backup",
          types: [{ description: "Dansk backup", accept: { "application/json": [".json"] } }],
        });
        const file = await handle.getFile();
        await processImportedBackup(await file.text());
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // they cancelled the picker
        // otherwise fall through to the plain file input below
      }
    }
    if (importInputRef.current) importInputRef.current.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    await processImportedBackup(await file.text());
  }

  const sub = { fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", lineHeight: 1.4, marginTop: 2 };
  const switchBtn = (on, label, onClick) => (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      style={{ flexShrink: 0, width: 42, height: 24, borderRadius: 999, border: "none", background: on ? "var(--fjord)" : "#D8D4C8", position: "relative", cursor: "pointer", padding: 0 }}
    >
      <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#FBFAF7", transition: "left 0.15s ease" }} />
    </button>
  );
  const row = { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line)", marginBottom: 10 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>Backup</div>
        <div style={{ display: "flex", gap: 2 }}>
          <button aria-label="More info" onClick={() => setHelpOpen((v) => !v)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex", color: helpOpen ? "var(--terracotta)" : "var(--muted)" }}>
            <Icon.HelpCircle size={18} />
          </button>
          <button aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--muted)" }}>
            <Icon.X size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={exportDeck} style={{ ...smallBtn("var(--fjord)"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 8px", fontSize: 14 }}>
          <Icon.Download size={14} /> Export
        </button>
        <button onClick={triggerImport} style={{ ...smallBtn("#A8A395"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 8px", fontSize: 14 }}>
          <Icon.Upload size={14} /> Import
        </button>
        <input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
      </div>

      {helpOpen && (
        <div style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.55, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ marginBottom: 6 }}>Export saves your deck to a file. Import loads one back in, and replaces what is in the app now.</div>
          <div style={{ marginBottom: 6 }}>To move your progress to another device, export into a folder that syncs (like iCloud Drive), then import on the other device.</div>
          <div style={{ marginBottom: 6 }}>Every export has the same name, dansk-backup.json. If your phone or browser asks, choose Replace to keep a single backup instead of numbered copies.</div>
          <div>The reminder is set per device. Turning it on here does not change your other devices.</div>
        </div>
      )}

      <div style={row}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13.5, fontWeight: 600 }}>Weekly reminder</div>
          <div style={sub}>A one-tap backup, only if something changed</div>
        </div>
        {switchBtn(autoBackupEnabled, "Toggle automatic backups", () => toggleAutoBackup(!autoBackupEnabled))}
      </div>

      {sync && sync.supported && (
        <>
          <button onClick={() => setSyncOpen(true)} aria-label="Sync" style={{ ...row, width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 13.5, fontWeight: 600 }}>Sync</div>
              <div style={{ ...sub, color: sync.status.state === "error" ? "var(--terracotta)" : "var(--muted)" }}>
                {!sync.enabled
                  ? "Off. Keep your devices in step."
                  : sync.status.state === "error"
                  ? sync.status.message
                  : sync.status.state === "syncing"
                  ? PROVIDER_NAMES[sync.provider] + " · syncing…"
                  : PROVIDER_NAMES[sync.provider] + (sync.status.at ? " · last synced " + new Date(sync.status.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : " · waiting for the first sync…")}
              </div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: 22, lineHeight: 1, flex: "none" }}>›</span>
          </button>
          {syncOpen && <SyncChooser sync={sync} onClose={() => setSyncOpen(false)} />}
        </>
      )}
    </div>
  );
}

function SyncChooser({ sync, onClose }) {
  const sub = { fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4, marginTop: 2 };
  const notes = {
    icloud: "Broen app on iPhone and iPad only. To sync with the website, select a different option",
    google: isNativeApp() ? "iPhone, iPad and website" : "On the website you sign in again each hour. Dropbox doesn't ask again",
    dropbox: "iPhone, iPad and website",
  };
  const choices = [...sync.options, ""];
  return (
    <CenteredOverlay onClose={onClose} maxWidth={420}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 18 }}>Sync your progress</div>
        <button aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--muted)" }}>
          <Icon.X size={18} />
        </button>
      </div>
      <div style={{ ...sub, marginBottom: 14 }}>Keeps your cards and progress in step across your devices. Pick one place. The newest change wins, and your AI key is never synced.</div>
      {choices.map((id) => {
        const on = sync.provider === id;
        const signed = id && id !== "icloud" && sync.signedIn[id];
        return (
          <button
            key={id || "off"}
            onClick={() => sync.choose(id)}
            aria-label={id ? PROVIDER_NAMES[id] : "Off"}
            aria-pressed={on}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", border: "1.5px solid " + (on ? "var(--fjord)" : "var(--line)"), background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + (on ? "var(--fjord)" : "var(--line)"), flex: "none", display: "grid", placeItems: "center" }}>
              {on && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--fjord)" }} />}
            </span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 15, fontWeight: 600 }}>{id ? PROVIDER_NAMES[id] : "Off"}</span>
              <span style={sub}>{id ? (signed ? "Signed in · " : "") + notes[id] : "Use backup files instead"}</span>
            </span>
          </button>
        );
      })}
      {(sync.enabled || sync.status.state === "error") && (
        <div style={{ ...sub, color: sync.status.state === "error" ? "var(--terracotta)" : "var(--muted)", margin: "4px 2px 8px" }}>
          {sync.status.state === "error"
            ? sync.status.message
            : sync.status.state === "syncing"
            ? "Syncing…"
            : sync.status.at
            ? "Last synced " + new Date(sync.status.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
            : "Waiting for the first sync…"}
        </div>
      )}
      {sync.enabled && sync.status.info && (
        <div style={{ ...sub, margin: "0 2px 8px" }}>
          {sync.status.info.none
            ? "The shared copy was empty, so this device saved its own."
            : "Shared copy: " + sync.status.info.known + " known words, saved " + new Date(sync.status.info.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + (sync.status.info.mine ? " by this device" : " by another device")}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
        {sync.enabled && sync.status.state === "error" && /^Sign in to/.test(sync.status.message || "") && (
          <button onClick={() => sync.reconnect(sync.provider)} style={{ ...linkBtn, fontWeight: 600 }}>
            Sign in to {PROVIDER_NAMES[sync.provider]} again
          </button>
        )}
        {sync.enabled && (
          <button onClick={() => sync.syncNow()} disabled={sync.status.state === "syncing"} style={linkBtn}>
            Sync now
          </button>
        )}
        {sync.provider && sync.provider !== "icloud" && (
          <button onClick={() => sync.signOutOf(sync.provider)} style={linkBtn}>
            Sign out of {PROVIDER_NAMES[sync.provider]}
          </button>
        )}
        {sync.earlierAt > 0 && (
          <button
            onClick={async () => {
              const yes = window.confirm ? window.confirm("Go back to your deck as it was when you turned on sync? Sync will be turned off, and anything you changed since then will be replaced.") : true;
              if (yes) await sync.goBack();
            }}
            style={linkBtn}
          >
            Go back to an earlier version
          </button>
        )}
      </div>
    </CenteredOverlay>
  );
}

const linkBtn = { border: "none", background: "none", padding: 0, color: "var(--fjord)", fontFamily: "var(--sans)", fontSize: 12, textDecoration: "underline", cursor: "pointer" };
