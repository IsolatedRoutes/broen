import { useState } from "react";
import { AIErrorNote } from "./AIErrorNote";
import { Icon } from "./icons";
import { renderInlineMarkdown } from "./markdown";
import { CenteredOverlay, Clearable, inputStyle, smallBtn } from "./ui";
import { apiErrorMessage, callAI } from "../lib/ai/index";
import { ANSWER_DEPTH_RULE } from "../lib/ai/prompts";
import { parseJSONLoose } from "../lib/text";

// The "Ask about this word" popup, shared by Study and the Dictionary card:
// a free-form question about one card, or a request to change the card.
export function AskCardPopup({ card, onClose, onUpdateCard, onOpenSettings, showToast }) {
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askModification, setAskModification] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");

  async function submitAsk() {
    if (!askQuestion.trim()) return;
        setAskLoading(true);
    setAskError("");
    setAskModification(null);
    try {
      const reply = await callAI(
        "You're a Danish tutor helping with a single flashcard a learner is studying. They'll either ask a genuine question about it, or ask you to modify the card itself — e.g. \"give me the present tense\", \"make this plural\", \"change to past tense\", \"fix the translation\" — work out which from their wording. " +
          "For a genuine question: answer directly in the reply field. " + ANSWER_DEPTH_RULE + "Don't pad the answer with extra context they didn't ask for. Write in plain text only: no headers, no markdown formatting, and short lines are fine. Leave newFront and newBack as empty strings. " +
          "For a modification request: work out the new Danish text and its natural English translation, and put them in newFront and newBack — keep the same conventions the original card used (e.g. keep a noun's en/et article if the original had one, omit it if the original didn't). Leave reply as an empty string, or at most a short one-line confirmation.",
        'The flashcard is: "' +
          card.front +
          '" (means: ' +
          card.back +
          '), type: ' +
          card.type +
          '. Their message: "' +
          askQuestion.trim() +
          '"\n\nRespond ONLY with JSON, no other text: {"reply": "...", "newFront": "...", "newBack": "..."} — use empty strings for whichever don\'t apply.',
        { maxTokens: 600 }
      );
      const parsed = parseJSONLoose(reply);
      setAskAnswer((parsed.reply || "").trim());
      if (parsed.newFront && parsed.newFront.trim()) {
        setAskModification({ front: parsed.newFront.trim(), back: (parsed.newBack || "").trim() });
      }
    } catch (e) {
      setAskError(apiErrorMessage(e));
    } finally {
      setAskLoading(false);
    }
  }

  function applyAskModification() {
    if (!askModification) return;
    onUpdateCard(card.id, { front: askModification.front, back: askModification.back });
    setAskModification(null);
    setAskAnswer("");
    onClose();
    if (showToast) showToast("Card updated");
  }

  return (
        <CenteredOverlay onClose={() => onClose()} maxWidth={380}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--terracotta)" }}>
              Ask about "{card.front}"
            </div>
            <button aria-label="Close" onClick={() => onClose()} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--muted)" }}>
              <Icon.X size={18} />
            </button>
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4 }}>
            Ask anything about this word, or tell me how to modify the card — e.g. "give me the present tense" or "make this plural".
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Clearable value={askQuestion} onClear={() => { setAskQuestion(""); }}><input
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAsk()}
              placeholder='e.g. "make this plural"'
              style={{ ...inputStyle, flex: 1 }}
            /></Clearable>
            <button onClick={submitAsk} disabled={askLoading || !askQuestion.trim()} style={smallBtn("var(--fjord)")}>
              {askLoading ? <Icon.Loader2 size={14} className="spin" /> : <Icon.Send size={14} />}
            </button>
          </div>
          {askError && <AIErrorNote message={askError} onOpenSettings={onOpenSettings} />}
          {askAnswer && (
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: "12px 14px", fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: askModification ? 10 : 0 }}>
              {renderInlineMarkdown(askAnswer)}
            </div>
          )}
          {askModification && (
            <div style={{ background: "var(--paper)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>
                Suggested update
              </div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, marginBottom: 12 }}>
                <span style={{ color: "var(--terracotta)" }}>{askModification.front}</span>
                {askModification.back && (
                  <>
                    {" "}
                    — <span style={{ color: "var(--sage)", fontStyle: "italic" }}>{askModification.back}</span>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={applyAskModification} style={{ ...smallBtn("var(--rust)"), flex: 1, padding: "8px", fontSize: 13 }}>
                  Update this card
                </button>
                <button onClick={() => setAskModification(null)} style={{ ...smallBtn("#A8A395"), flex: 1, padding: "8px", fontSize: 13 }}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </CenteredOverlay>
  );
}
