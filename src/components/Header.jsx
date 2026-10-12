import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { CONTACT_EMAIL, INFO_PAGES } from "../data/infoPages";
import { TAB_ITEMS } from "./TabBar";

// The same test the page's CSS uses for "computer or iPad": there the screens live in a sidebar.
const WIDE = "(min-width: 768px) and (min-height: 600px)";
function useWide() {
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(WIDE).matches;
  const [wide, setWide] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function Header({ onOpenSettings, onOpenBackup, onOpenInfo, settingsOpen, backupOpen, tab, setTab }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const wide = useWide();
  return (
    <>
    {!wide && <div className="hdr-narrow" style={{ padding: "22px 18px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, margin: 0, fontWeight: 400, letterSpacing: 0.2 }}>
          Dansk<span style={{ color: "var(--rust)" }}>.</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onOpenBackup}
            aria-label="Backup and sync"
            style={{ border: "none", background: "none", color: backupOpen ? "var(--fjord)" : "var(--muted)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: backupOpen ? 700 : 400, padding: 0 }}
          >
            <Icon.Download size={12} />
            Backup
            {backupOpen ? <Icon.ChevronUp size={11} /> : null}
          </button>
          <button
            onClick={onOpenSettings}
            style={{ border: "none", background: "none", color: settingsOpen ? "var(--fjord)" : "var(--muted)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: settingsOpen ? 700 : 400, padding: 0 }}
          >
            <Icon.Key size={12} />
            AI settings
            {settingsOpen ? <Icon.ChevronUp size={11} /> : null}
          </button>
          <div style={{ position: "relative", display: "flex" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              style={{ border: "none", background: "none", color: menuOpen ? "var(--fjord)" : "var(--muted)", cursor: "pointer", padding: 2, display: "flex" }}
            >
              <Icon.Menu size={17} />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
                <div
                  className="popover"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    zIndex: 91,
                    minWidth: 150,
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    padding: 4,
                  }}
                >
                  {INFO_PAGES.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenInfo(page.id);
                      }}
                      style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "none", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: 14, padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
                    >
                      {page.title}
                    </button>
                  ))}
                  {CONTACT_EMAIL && (
                    <a
                      href={"mailto:" + CONTACT_EMAIL}
                      onClick={() => setMenuOpen(false)}
                      style={{ display: "block", textAlign: "left", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: 14, padding: "10px 12px", borderRadius: 8, textDecoration: "none" }}
                    >
                      Contact
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>}
    {wide && <aside className="side-wide" aria-label="Main">
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, margin: "0 0 22px 10px", fontWeight: 400, letterSpacing: 0.2 }}>
        Dansk<span style={{ color: "var(--rust)" }}>.</span>
      </h1>
      <nav aria-label="Screens" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {TAB_ITEMS.map(({ id, label, icon: IconCmp }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? "page" : undefined}
              style={{ border: "none", background: active ? "var(--card)" : "none", borderRadius: 999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", color: active ? "var(--rust)" : "var(--muted)", fontFamily: "var(--sans)", fontSize: 15, fontWeight: active ? 600 : 400, textAlign: "left" }}
            >
              <IconCmp size={18} strokeWidth={active ? 2.1 : 1.7} />
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
        <button onClick={onOpenBackup} aria-label="Backup and sync" style={{ ...utilBtn, color: backupOpen ? "var(--fjord)" : "var(--muted)", fontWeight: backupOpen ? 700 : 400 }}>
          <Icon.Download size={15} />
          Backup
        </button>
        <button onClick={onOpenSettings} aria-label="AI settings" style={{ ...utilBtn, color: settingsOpen ? "var(--fjord)" : "var(--muted)", fontWeight: settingsOpen ? 700 : 400 }}>
          <Icon.Key size={15} />
          AI settings
        </button>
        <button onClick={() => setSideMenuOpen((o) => !o)} aria-label="More" aria-expanded={sideMenuOpen} style={{ ...utilBtn, color: sideMenuOpen ? "var(--fjord)" : "var(--muted)" }}>
          <Icon.Menu size={15} />
          More
        </button>
        {sideMenuOpen && (
          <>
            <div onClick={() => setSideMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
            <div className="popover" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 91, minWidth: 170, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 4 }}>
              {INFO_PAGES.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSideMenuOpen(false);
                    onOpenInfo(page.id);
                  }}
                  style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "none", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: 14, padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  {page.title}
                </button>
              ))}
              {CONTACT_EMAIL && (
                <a href={"mailto:" + CONTACT_EMAIL} onClick={() => setSideMenuOpen(false)} style={{ display: "block", textAlign: "left", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: 14, padding: "10px 12px", borderRadius: 8, textDecoration: "none" }}>
                  Contact
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </aside>}
    </>
  );
}

const utilBtn = { border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "var(--sans)", fontSize: 13.5, padding: "8px 16px", borderRadius: 999, textAlign: "left" };
