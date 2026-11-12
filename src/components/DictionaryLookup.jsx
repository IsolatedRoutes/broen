import { useEffect, useRef, useState } from "react";
import { AIErrorNote } from "./AIErrorNote";
import { Icon } from "./icons";
import { PillButton, quietLink } from "./layout";
import { LOOKUP_SYSTEM, cardTypeFor, lookupUserText, readLookup } from "../lib/addLookup";
import { formsField } from "../lib/ownFormsCore";
import { apiErrorMessage, callAI } from "../lib/ai/index";
import { isLessonsCategory, topicNamesForAI } from "../data/categories";
import { frontKey, parseJSONLoose } from "../lib/text";

// A word that is not in the deck: ONE AI call, started by Return (never while typing),
// shown as a card with "Add card". The parent mounts this with key={query}, so changing
// what is typed throws the old answer away. Nothing is saved until "Add card".
export function DictionaryLookup({ q, englishFirst, categories, cards, addCards, onOpenSettings, onDismiss, onShow, showToast }) {
  const [state, setState] = useState({ status: "loading", result: null, error: "" });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      try {
        const reply = await callAI(LOOKUP_SYSTEM, lookupUserText(q, englishFirst ? "en" : "auto", topicNamesForAI(categories)), { maxTokens: 500 });
        const result = readLookup(parseJSONLoose(reply));
        if (alive.current) setState({ status: "done", result, error: "" });
      } catch (e) {
        if (alive.current) setState({ status: "error", result: null, error: apiErrorMessage(e) });
      }
    })();
    return () => {
      alive.current = false;
    };
    // One call per mount: the parent remounts this when the typed text changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap = { padding: "14px 16px", borderTop: "1px solid var(--line)", fontFamily: "var(--sans)" };
  const label = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };

  if (state.status === "loading") {
    return (
      <div style={wrap} role="status">
        <div style={{ ...label, marginBottom: 0 }}>
          <Icon.Loader2 className="spin" size={14} color="var(--muted)" /> Not in your deck. Looking it up…
        </div>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div style={wrap}>
        <div style={label}>Not in your deck</div>
        <AIErrorNote message={state.error} onOpenSettings={onOpenSettings} />
        <button onClick={onDismiss} style={{ ...quietLink, marginTop: 10 }}>Close</button>
      </div>
    );
  }

  const r = state.result;
  const existing = cards.find((c) => frontKey(c.front) === frontKey(r.da));
  function add() {
    const type = cardTypeFor(r.da);
    const topic = categories.find((c) => !isLessonsCategory(c) && r.category && c.name.toLowerCase() === r.category.toLowerCase());
    addCards([
      {
        type,
        front: r.da,
        back: r.en,
        notes: "",
        category: topic ? topic.id : "",
        ...(type === "word" && r.wordType ? { pos: r.wordType } : {}),
        ...(r.level ? { level: r.level } : {}),
        ...(r.forms ? formsField(type, r.da, r.forms) : {}),
      },
    ]);
    if (showToast) showToast("Added " + r.da);
    onShow(r.da); // the new card now matches the search
  }
  const meta = [r.wordType, r.level ? "level " + r.level : "", r.category].filter(Boolean).join(" · ");

  return (
    <div style={wrap}>
      <div style={label}>{existing ? "Already in your deck" : "Not in your deck · looked up by AI"}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--terracotta)" }}>{r.da}</div>
      <div style={{ color: "var(--sage)", fontStyle: "italic", fontSize: 15, marginTop: 2 }}>{r.en}</div>
      {meta && <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 6 }}>{meta}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        {existing ? (
          <PillButton kind="secondary" onClick={() => onShow(r.da)}>Show it</PillButton>
        ) : (
          <PillButton onClick={add}>Add card</PillButton>
        )}
        <button onClick={onDismiss} style={quietLink}>Not right?</button>
      </div>
    </div>
  );
}
