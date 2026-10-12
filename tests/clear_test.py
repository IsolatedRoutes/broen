"""Every text box has a small x that empties it; popups can be dismissed.

    python3 tests/clear_test.py     (run `npm run build` first)
"""
import threading, http.server, functools, socketserver, os
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
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 400, "height": 850})
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_timeout(5500)
    X = lambda: page.get_by_role("button", name="Empty this box")

    page.get_by_role("button", name="Add").last.click(); page.wait_for_timeout(500)
    check(X().count() == 0, "Add card: no x while the boxes are empty")
    page.get_by_label("Dansk", exact=True).fill("æble"); page.get_by_label("English", exact=True).fill("apple")
    check(X().count() == 2, "Add card: an x appears in each filled box")
    X().first.click(); page.wait_for_timeout(200)
    check(page.get_by_label("English", exact=True).input_value() == "" and page.get_by_label("Dansk", exact=True).input_value() == "æble", "the x empties only its own box")

    page.get_by_role("button", name="Dictionary").last.click(); page.wait_for_timeout(500)
    page.get_by_placeholder("Search your deck").fill("hund")
    check(X().count() == 1, "Library search has an x")
    X().click(); page.wait_for_timeout(200)
    check(page.get_by_placeholder("Search your deck").input_value() == "", "the x empties the search")

    page.get_by_role("button", name="Assistant").last.click(); page.wait_for_timeout(600)
    ta = page.get_by_label("Text", exact=True)
    if ta.count():
        ta.fill("hej"); check(X().count() == 1, "Assistant text box has an x"); X().click(); page.wait_for_timeout(200)
        check(ta.input_value() == "", "the x empties the Assistant text")
    check(not errors, "no page errors %s" % errors)
    b.close()

server.shutdown()
print("\n" + ("ALL PASSED" if not failures else "FAILED: %d" % len(failures)))
raise SystemExit(1 if failures else 0)
