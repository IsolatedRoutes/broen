"""Chat: the example text, follow-up questions keep the conversation, answers are asked to be useful,
and "Save as flashcard" shows the card first and adds exactly one. Add screen wording.

    python3 tests/chat_test.py     (run `npm run build` first; nothing is sent to a real AI)
"""
import os, json, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/index.html" % server.server_address[1]
failures = []
def check(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: failures.append(msg)

SETKV = """(kv) => new Promise((res) => { const r = indexedDB.open('dansk'); r.onsuccess = () => {
  const t = r.result.transaction('kv', 'readwrite'); for (const k in kv) t.objectStore('kv').put(kv[k], k);
  t.oncomplete = () => res(true); }; })"""
GET = """() => new Promise((res) => { const r = indexedDB.open('dansk'); r.onsuccess = () => {
  const g = r.result.transaction('kv').objectStore('kv').get('cards');
  g.onsuccess = () => res(g.result); g.onerror = () => res(null); }; r.onerror = () => res(null); })"""

sent = []
def answer_for(body):
    if "Question:" in body and "Answer:" in body:  # Save as flashcard
        return {"type": "grammar", "front": "en or et", "back": "Most nouns are en-words; patterns help you guess.",
                "examples": [{"da": "en bil", "en": "a car"}, {"da": "et hus", "en": "a house"}, {"da": "en bog", "en": "a book"}], "forms": []}
    return {"reply": "About 3 in 4 nouns are en-words. Patterns: people and animals are mostly en.", "flashcards": []}

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={"width": 400, "height": 900}).new_page()
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_timeout(6000)
    page.evaluate(SETKV, {"aiEngine": "gemini", "aiConsent": "1", "geminiApiKey": "fake-key"})
    page.reload(); page.wait_for_timeout(5000)
    def fake(route):
        body = route.request.post_data or ""
        sent.append(body)
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(answer_for(body))}]}}]}))
    page.route("**/generativelanguage.googleapis.com/**", fake)

    # Add screen wording
    page.get_by_role("button", name="Add").last.click(); page.wait_for_timeout(600)
    check(page.get_by_placeholder("e.g. an apple…").count() == 1 and page.get_by_placeholder("f.eks. et æble…").count() == 1, "Add examples end with three dots")
    page.get_by_role("button", name="Word or sentence").click(); page.wait_for_timeout(300)
    page.get_by_text("Grammar lesson", exact=True).first.click(); page.wait_for_timeout(500)
    check(page.get_by_placeholder("Grammar rule").count() == 1 and "What the rule is" not in page.content(), "the lesson box says Grammar rule")
    page.get_by_role("button", name="+ Add a note").click(); page.wait_for_timeout(300)
    note = page.get_by_label("Note"); expl = page.get_by_label("Explanation")
    nb, eb = note.bounding_box(), expl.bounding_box()
    check(note.count() == 1 and abs(nb["width"] - eb["width"]) < 3 and nb["height"] > 40, "the note is a full box as wide as the explanation (%s vs %s)" % (round(nb["width"]), round(eb["width"])))

    # Chat
    page.get_by_role("button", name="Assistant").last.click(); page.wait_for_timeout(800)
    page.get_by_role("button", name="Chat", exact=True).first.click(); page.wait_for_timeout(500)
    check("not “et bil”" in page.inner_text("body") or "not “et bil”" in page.inner_text("body"), "the first example reads: why is it en bil not et bil")
    box = page.get_by_placeholder("Ask or give instructions…")
    box.fill("why is it en bil but et hus"); box.press("Enter"); page.wait_for_timeout(1500)
    box.fill("what are the rules for using et and en"); box.press("Enter"); page.wait_for_timeout(1500)
    second = [s for s in sent if "what are the rules for using et and en" in s]
    check(bool(second) and "why is it en bil but et hus" in second[-1], "a follow-up is sent with the earlier question (it remembers)")
    check(bool(second) and "About 3 in 4 nouns" in second[-1], "...and with the earlier answer")
    check(bool(second) and "no rules" in second[-1] and "memorize" in second[-1], "the AI is told never to just say there are no rules")

    # Save as flashcard: look first, then exactly one card
    before = len(json.loads(page.evaluate(GET)))
    page.get_by_role("button", name="Save as flashcard").last.click(); page.wait_for_timeout(1800)
    pop = page.locator(".popover").last.inner_text()
    check("en or et" in pop and "grammar lesson" in pop.lower() and "a car" in pop, "a preview shows the card, its type and its examples before anything is added")
    check(len(json.loads(page.evaluate(GET))) == before, "nothing is added until the learner confirms")
    page.locator(".popover").last.get_by_role("button", name="Add selected to deck").click(); page.wait_for_timeout(1200)
    after = json.loads(page.evaluate(GET))
    check(len(after) == before + 1, "exactly one card is added (%d -> %d)" % (before, len(after)))
    mine = [c for c in after if c.get("front") == "en or et"]
    check(len(mine) == 1 and mine[0]["type"] == "grammar" and len(mine[0].get("examples", [])) == 3, "the lesson keeps its 3 examples inside it")
    check(not errors, "no page errors %s" % errors)
    browser.close()

server.shutdown()
print("\n" + ("ALL PASSED" if not failures else "FAILED: %d" % len(failures)))
raise SystemExit(1 if failures else 0)
