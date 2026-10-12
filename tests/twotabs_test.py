"""Two open tabs must not reload each other forever; a normal start must not rewrite the saved deck;
popups work on a computer-sized window; Contact shows the address.

    python3 tests/twotabs_test.py     (run `npm run build` first)
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
    ctx = b.new_context(viewport={"width": 1280, "height": 800}, service_workers="block")
    a = ctx.new_page(); a.goto(URL); a.wait_for_timeout(6000)

    # A second start must not announce a change to other tabs.
    probe = ctx.new_page(); probe.goto(URL + "manifest.webmanifest")
    probe.evaluate("()=>{window.__m=[];const c=new BroadcastChannel('dansk-sync');c.onmessage=(ev)=>window.__m.push(String(ev.data));}")
    a.reload(); a.wait_for_timeout(6000)
    saved = [m for m in probe.evaluate("()=>window.__m") if m in ("cards", "categories")]
    check(saved == [], "opening the app again does not rewrite the saved deck (%s)" % saved)
    probe.close()

    # Two tabs side by side stay calm.
    navs = {"a": 0, "b": 0}
    a.on("framenavigated", lambda f: navs.__setitem__("a", navs["a"] + 1) if f == a.main_frame else None)
    bpage = ctx.new_page(); bpage.on("framenavigated", lambda f: navs.__setitem__("b", navs["b"] + 1) if f == bpage.main_frame else None)
    bpage.goto(URL); bpage.wait_for_timeout(15000)
    check(navs["a"] <= 3 and navs["b"] <= 3, "two tabs do not reload each other in a loop (%s)" % navs)
    bpage.close()

    # Popups on a computer-sized window can be used (not hidden behind the page).
    a.get_by_label("Backup and sync").click(); a.wait_for_timeout(500)
    a.get_by_role("button", name="Close").first.click(timeout=5000); a.wait_for_timeout(300)  # fails if the popup is covered
    check(True, "backup popup opens above the page and its buttons can be clicked")

    # Contact lists the address.
    a.get_by_label("More").click(); a.wait_for_timeout(300)
    a.get_by_role("button", name="Contact").click(); a.wait_for_timeout(400)
    check("isolatedroutes@gmail.com" in a.inner_text("body"), "Contact shows the email address")
    check(a.get_by_role("button", name="Copy address").count() == 1, "Contact has a Copy address button")
    b.close()

server.shutdown()
print("\n" + ("ALL PASSED" if not failures else "FAILED: %d" % len(failures)))
raise SystemExit(1 if failures else 0)
