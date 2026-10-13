"""Tapping the check or star leaves no focus line behind.

    python3 tests/focusline_test.py     (run `npm run build` first)
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

OUTLINE = "() => { const e = document.activeElement; return e ? getComputedStyle(e).outlineStyle : 'none'; }"
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 400, "height": 850})
    page.goto(URL); page.wait_for_timeout(5500)
    page.get_by_role("button", name="Mark as known").first.click(); page.wait_for_timeout(400)
    check(page.evaluate(OUTLINE) in ("none", ""), "after tapping the check there is no focus line")
    page.get_by_role("button", name="Star this card").first.click(); page.wait_for_timeout(400)
    check(page.evaluate(OUTLINE) in ("none", ""), "after tapping the star there is no focus line")
    b.close()
print("ALL PASSED" if not failures else "FAILED: %d" % len(failures))
raise SystemExit(1 if failures else 0)
