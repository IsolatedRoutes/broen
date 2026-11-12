"""Dictionary: a word that is not in the deck is looked up with AI when Return is pressed
(never while typing), shown as a card with "Add card".

    python3 tests/dictlookup_test.py     (run `npm run build` first; nothing is sent to a real AI)
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

calls = []
reply = {"danish": "en kvuzzel", "english": "a kvuzzle", "category": "", "wordType": "noun", "level": 2, "forms": []}

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={"width": 400, "height": 900}).new_page()
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_timeout(6000)
    page.evaluate(SETKV, {"aiEngine": "gemini", "aiConsent": "1", "geminiApiKey": "fake-key"})
    page.reload(); page.wait_for_timeout(5000)
    def fake(route):
        calls.append(1)
        route.fulfill(status=200, content_type="application/json", body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(reply)}]}}]}))
    page.route("**/generativelanguage.googleapis.com/**", fake)

    page.get_by_role("button", name="Dictionary").last.click(); page.wait_for_timeout(600)
    box = page.get_by_placeholder("Search your deck")
    box.fill("kvuzzle"); page.wait_for_timeout(600)
    check("Press Return to look it up with AI" in page.inner_text("body"), "no match: tells you to press Return")
    check(len(calls) == 0, "typing alone makes no AI call")
    box.press("Enter"); page.wait_for_timeout(1500)
    body = page.inner_text("body")
    check("LOOKED UP BY AI" in body.upper(), "Return shows the looked-up card")
    check("en kvuzzel" in body and "a kvuzzle" in body, "the card shows both sides")
    check(len(calls) == 1, "exactly one AI call")
    box.fill("kvuzzl"); page.wait_for_timeout(400)
    check(page.get_by_role("button", name="Add card").count() == 0, "changing the text drops the old answer")
    box.fill("kvuzzle"); page.wait_for_timeout(300); box.press("Enter"); page.wait_for_timeout(1500)
    check(len(calls) == 2, "Return again looks up again")
    page.get_by_role("button", name="Not right?").click(); page.wait_for_timeout(300)
    check(page.get_by_role("button", name="Add card").count() == 0, "Not right? closes the answer")
    box.press("Enter"); page.wait_for_timeout(1500)
    page.get_by_role("button", name="Add card").click(); page.wait_for_timeout(1200)
    check(box.input_value() == "en kvuzzel", "after Add card the search shows the new word")
    check(page.get_by_role("button", name="Open the card for en kvuzzel").count() == 1, "the new card is in the list")
    saved = page.evaluate(GET) or []
    saved = json.loads(saved) if isinstance(saved, str) else saved
    mine = [c for c in saved if c.get("front") == "en kvuzzel"]
    check(len(mine) == 1 and mine[0].get("back") == "a kvuzzle" and mine[0].get("level") == 2, "the card was saved with its level")

    # Some matches: Return does nothing, the link does the lookup.
    n = len(calls)
    box.fill("hund"); page.wait_for_timeout(500); box.press("Enter"); page.wait_for_timeout(600)
    check(len(calls) == n, "with matches, Return makes no AI call")
    check(page.get_by_text("Look up “hund” with AI").count() == 1, "with matches, a small link offers the AI lookup")

    # A word the AI gives back that is already in the deck.
    reply.update({"danish": "en hund", "english": "a dog"})
    box.fill("kvuzzlex"); page.wait_for_timeout(500); box.press("Enter"); page.wait_for_timeout(1500)
    check("ALREADY IN YOUR DECK" in page.inner_text("body").upper(), "a word already in the deck says so")
    check(page.get_by_role("button", name="Add card").count() == 0 and page.get_by_role("button", name="Show it").count() == 1, "no second copy offered, Show it instead")
    check(not errors, "no page errors: " + "; ".join(errors))
    browser.close()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={"width": 400, "height": 900}).new_page()
    page.goto(URL); page.wait_for_timeout(6000)
    page.evaluate(SETKV, {"aiEngine": "gemini", "aiConsent": "1"})
    page.reload(); page.wait_for_timeout(5000)
    page.get_by_role("button", name="Dictionary").last.click(); page.wait_for_timeout(600)
    box = page.get_by_placeholder("Search your deck"); box.fill("kvuzzle"); box.press("Enter"); page.wait_for_timeout(1200)
    check("AI settings" in page.inner_text("body"), "with no AI set up, it says how to set it up")
    browser.close()

print("ALL PASSED" if not failures else "FAILED: %d" % len(failures))
raise SystemExit(1 if failures else 0)
