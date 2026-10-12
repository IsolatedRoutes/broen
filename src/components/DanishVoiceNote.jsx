import { useEffect, useState } from "react";
import { onNoDanishVoice, onBasicDanishVoice } from "../lib/speech";
import { isNativeApp } from "../lib/platform";
import { storeGet, storeSet } from "../lib/storage";
import { Icon } from "./icons";
import { CenteredOverlay, smallBtn } from "./ui";

// Spoken Danish needs a setting on the device, and an app can't open that setting for
// the person. So this is a short tutorial: a popup that can be dismissed, or a few
// steps that say where to tap. Shown (a) when the device has no Danish voice at all,
// every time a speaker is tapped, and (b) once, when the only Danish voice is a plain one.

function deviceKind() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const touchMac = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  if (isNativeApp() || /iPhone|iPad|iPod/.test(ua) || touchMac) return "ios";
  if (/Macintosh/.test(ua)) return "mac";
  if (/Android/.test(ua)) return "android";
  return "computer";
}

const STEPS = {
  ios: [
    ["Open Settings", "Open the Settings app on this device."],
    ["Go to Spoken Content", "Tap Accessibility, then Spoken Content, then Voices."],
    ["Choose Danish", "Tap Danish, then pick a voice from the list."],
    ["Download a better one", "Tap the download arrow next to a voice marked Enhanced or Premium. It takes a minute."],
    ["Come back here", "Return to Dansk and tap the speaker on a card."],
  ],
  mac: [
    ["Open System Settings", "Open the Apple menu, then System Settings."],
    ["Go to Spoken Content", "Tap Accessibility, then Spoken Content."],
    ["Add a Danish voice", "Next to System voice, choose Manage Voices, then Danish. Download one marked Enhanced or Premium."],
    ["Come back here", "Return to Dansk and tap the speaker on a card."],
  ],
  android: [
    ["Open Settings", "Open the Settings app, then System, then Languages."],
    ["Go to Text-to-speech", "Tap Text-to-speech output, then the gear next to Google."],
    ["Install Danish", "Tap Install voice data, then Danish, and pick the best-sounding voice."],
    ["Come back here", "Return to Dansk and tap the speaker on a card."],
  ],
  computer: [
    ["Use Edge or Chrome", "Microsoft Edge has natural-sounding Danish voices built in. Chrome has a Google Danish voice."],
    ["Add Danish to your computer", "On Windows, open Settings, Time & language, Speech, and add the Danish voices. On other systems, look for Danish in text-to-speech settings."],
    ["Come back here", "Reload this page and tap the speaker on a card."],
  ],
};

const SEEN_KEY = "voiceTipSeen";

export function DanishVoiceNote() {
  const [mode, setMode] = useState(null); // null | "none" | "basic"
  const [step, setStep] = useState(-1); // -1 = the short popup, 0.. = tutorial steps

  useEffect(() => onNoDanishVoice(() => { setMode("none"); setStep(-1); }), []);
  useEffect(
    () =>
      onBasicDanishVoice(async () => {
        try {
          if (await storeGet(SEEN_KEY)) return;
        } catch {
          return;
        }
        setMode((m) => m || "basic");
        setStep(-1);
      }),
    [],
  );

  if (!mode) return null;
  const steps = STEPS[deviceKind()];
  const close = () => {
    if (mode === "basic") storeSet(SEEN_KEY, "1").catch(() => {});
    setMode(null);
    setStep(-1);
  };
  const bodyStyle = { fontFamily: "var(--sans)", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 };
  const quiet = { border: "none", background: "none", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 13.5, cursor: "pointer", padding: 4 };

  if (step < 0) {
    const none = mode === "none";
    return (
      <CenteredOverlay onClose={close} maxWidth={340} closeX>
        <div style={{ textAlign: "center" }}>
          <Icon.Volume2 size={22} color="var(--fjord)" style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: "var(--serif)", fontSize: 17, marginBottom: 8 }}>{none ? "Spoken Danish isn't turned on" : "Get the highest quality Danish voice"}</div>
          <div style={{ ...bodyStyle, marginBottom: 16 }}>
            {none ? "This device needs a Danish voice before it can read Danish aloud. It takes a minute to turn on." : "Your device controls the Danish voice that is used in this app. To change it, go to settings and follow these steps."}
          </div>
          <button onClick={() => setStep(0)} style={{ ...smallBtn("var(--fjord)"), width: "100%", padding: "10px", fontSize: 14, marginBottom: 8 }}>
            Show me how
          </button>
          <button onClick={close} style={{ ...smallBtn("#A8A395"), width: "100%", padding: "10px", fontSize: 14 }}>
            Not now
          </button>
        </div>
      </CenteredOverlay>
    );
  }

  const [title, text] = steps[step];
  const last = step === steps.length - 1;
  return (
    <CenteredOverlay onClose={close} maxWidth={340} closeX>
      <div style={{ fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
        Step {step + 1} of {steps.length}
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.3, marginBottom: 8 }}>{title}</div>
      <div style={{ ...bodyStyle, fontSize: 14.5, marginBottom: 18 }}>{text}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setStep(step - 1)} style={quiet}>
          Back
        </button>
        {last ? (
          <button onClick={close} style={smallBtn("var(--fjord)")}>
            Done
          </button>
        ) : (
          <button onClick={() => setStep(step + 1)} style={smallBtn("var(--fjord)")}>
            Next
          </button>
        )}
      </div>
    </CenteredOverlay>
  );
}
