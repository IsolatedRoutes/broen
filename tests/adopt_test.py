"""Checks that older copies of built-in words (from an old deck or backup) are built-in
cards again, with their marks kept, while a card the person really added stays theirs.

    python3 tests/adopt_test.py

Run `npm run build` first. Needs Python Playwright.
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

READ = """() => new Promise((res) => { const r = indexedDB.open('dansk'); r.onsuccess = () => {
  const g = r.result.transaction('kv').objectStore('kv').get('cards');
  g.onsuccess = () => res(g.result === undefined ? null : g.result); g.onerror = () => res(null); }; r.onerror = () => res(null); })"""
WRITE = """(text) => new Promise((res) => { const r = indexedDB.open('dansk'); r.onsuccess = () => {
  const t = r.result.transaction('kv', 'readwrite'); t.objectStore('kv').put(text, 'cards');
  t.oncomplete = () => res(true); t.onerror = () => res(false); }; r.onerror = () => res(false); })"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 400, "height": 800})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_timeout(6000)

    cards = json.loads(page.evaluate(READ))
    words = [c for c in cards if c.get("starter") and c.get("type") == "word"][:3]
    ids = [w["id"] for w in words]
    fronts = [w["front"] for w in words]
    # Pretend these three came from an older deck: plain cards, with marks.
    for c in cards:
        if c["id"] == ids[0]: c.pop("starter", None); c["known"] = True
        if c["id"] == ids[1]: c["starter"] = False; c["notes"] = "my note"; c["starred"] = True
        if c["id"] == ids[2]: c["starter"] = False; c["back"] = "my own wording"
    cards.append({"id": "own1", "type": "word", "front": "min helt egen ting", "back": "my very own thing", "starter": False, "createdAt": 1, "category": ""})
    check(page.evaluate(WRITE, json.dumps(cards)), "older-style deck saved")
    page.reload(); page.wait_for_timeout(7000)

    after = {c["id"]: c for c in json.loads(page.evaluate(READ))}
    first = next((c for c in after.values() if c["front"] == fronts[0]), None)
    second = next((c for c in after.values() if c["front"] == fronts[1]), None)
    third = next((c for c in after.values() if c["front"] == fronts[2]), None)
    check(first and first.get("starter") is True and first.get("known") is True, "an older copy of a built-in word is built-in again and stays known")
    check(second and second.get("starter") is True and second.get("starred") and second.get("notes") == "my note", "its star and note are kept")
    check(third and third.get("starter") is True and third.get("back") == "my own wording", "the person's own wording is kept")
    mine = [c for c in after.values() if not c.get("starter")]
    check(len(mine) == 1 and mine[0]["front"] == "min helt egen ting", "only the card the person really added still counts as theirs")
    check(len([c for c in after.values() if c["front"] == fronts[0]]) == 1, "no duplicate was made")
    check(not errors, "no page errors")
    browser.close()

print("ALL PASSED" if not failures else "FAILED: %s" % failures)
raise SystemExit(1 if failures else 0)
