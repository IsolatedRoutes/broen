"""Broen AI: no key needed; hidden until the relay address is set; used for chat and photos.

    python3 tests/broen_ai_test.py     (run `npm run build` first)
"""
import threading, http.server, functools, socketserver, os, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/" % server.server_address[1]

failures = []
def check(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: failures.append(msg)

with sync_playwright() as p:
    browser = p.chromium.launch()

    # 1. No relay address: the option is not offered, privacy text unchanged.
    page = browser.new_context(viewport={"width": 400, "height": 900}).new_page()
    page.goto(URL); page.wait_for_timeout(5500)
    page.get_by_role("button", name="AI settings").first.click(); page.wait_for_timeout(500)
    check(page.get_by_text("Broen AI").count() == 0, "without a relay address, Broen AI is not offered")

    # 2. With the address: offered, needs agreeing, then works with no key.
    ctx = browser.new_context(viewport={"width": 400, "height": 900})
    ctx.add_init_script("window.__BROEN_AI__ = { proxyUrl: 'https://relay.test' };")
    page = ctx.new_page()
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    calls = []; state = {"mode": "ok"}
    def relay(route):
        req = route.request
        h = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*"}
        if req.method == "OPTIONS": return route.fulfill(status=204, headers=h)
        if req.url.endswith("/ai"):
            calls.append(json.loads(req.post_data))
            if state["mode"] == "used":
                return route.fulfill(status=429, headers=h, content_type="application/json", body=json.dumps({"error": "TRIAL_USED"}))
            return route.fulfill(status=200, headers=h, content_type="application/json", body=json.dumps({"text": json.dumps({"reply": "Hej fra Broen AI", "flashcards": []}), "remaining": 24, "limit": 25}))
        return route.fulfill(status=200, headers=h, content_type="application/json", body=json.dumps({"remaining": 25, "limit": 25}))
    page.route("https://relay.test/**", relay)
    page.goto(URL); page.wait_for_timeout(5500)
    page.get_by_role("button", name="AI settings").first.click(); page.wait_for_timeout(800)
    check(page.get_by_text("No key needed").count() == 1 and page.get_by_text("25 free tries left").count() == 1, "Broen AI is offered, with the tries left")
    page.get_by_role("button", name="Agree and use").click(); page.wait_for_timeout(600)
    check(page.get_by_text("In use").count() == 1, "after agreeing it is in use")
    page.get_by_role("button", name="Close").first.click(); page.wait_for_timeout(300)

    page.get_by_role("button", name="Assistant").last.click(); page.wait_for_timeout(800)
    page.get_by_role("button", name="Chat", exact=True).first.click(); page.wait_for_timeout(500)
    box = page.get_by_placeholder("Ask or give instructions…")
    box.fill("hvad betyder hej"); box.press("Enter"); page.wait_for_timeout(1500)
    check("Hej fra Broen AI" in page.inner_text("body"), "the chat answers through the relay with no key")
    check(len(calls) == 1 and calls[0]["device"] and len(calls[0]["device"]) >= 8 and "hvad betyder hej" in json.dumps(calls[0]["messages"]), "the request carries an anonymous install id and the question")
    check(set(calls[0].keys()) == {"device", "system", "messages", "maxTokens"}, "only the install id, the instructions and the question are sent (no key, no other data)")

    # 3. Free tries used up: a plain message pointing to AI settings.
    state["mode"] = "used"
    box.fill("en til"); box.press("Enter"); page.wait_for_timeout(1500)
    body = page.inner_text("body")
    check("used your free Broen AI tries" in body, "when the tries are used up the learner is told plainly what to do")

    check(not errors, "no page errors (%s)" % errors[:1])
    browser.close()
print("ALL PASSED" if not failures else "FAILED: %d" % len(failures))
raise SystemExit(1 if failures else 0)
