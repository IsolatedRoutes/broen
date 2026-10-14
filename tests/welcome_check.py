"""Landing page (welcome/): loads, links work, no sideways scroll on a phone, search tags present.

    python3 tests/welcome_check.py
"""
import threading, http.server, functools, socketserver, os, json, re
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d/" % server.server_address[1]
failures = []
def check(ok, msg):
    print(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: failures.append(msg)

html = open(os.path.join(ROOT, "welcome", "index.html"), encoding="utf-8").read()
check("<title>" in html and 40 < len(re.search(r"<title>(.*?)</title>", html).group(1)) < 80, "title is present and a sensible length")
check(60 < len(re.search(r'name="description" content="(.*?)"', html).group(1)) <= 160, "meta description is present")
check('rel="canonical"' in html and 'property="og:image"' in html and 'twitter:card' in html, "canonical link and sharing tags are present")
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
ld = json.loads(blocks[0])
check({n["@type"] for n in ld["@graph"]} == {"SoftwareApplication", "FAQPage"}, "structured data parses (app + FAQ)")
faq_q = [q["name"] for n in ld["@graph"] if n["@type"] == "FAQPage" for q in n["mainEntity"]]
check(all(q.replace("&ldquo;", "").split("?")[0][:20] in html for q in faq_q), "every structured-data question is also visible on the page")
check(html.count("<h1") == 1, "exactly one main heading")
check(html.count('class="sc s') == 6, "hero demo has six scenes")
check("Your bridge to" in html, "headline is the app tagline")
check(os.path.exists(os.path.join(ROOT, "welcome", "og.png")) and os.path.exists(os.path.join(ROOT, "robots.txt")) and os.path.exists(os.path.join(ROOT, "sitemap.xml")), "preview image, robots.txt and sitemap exist")

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1280, 900), (390, 844)]:
        page = b.new_page(viewport={"width": w, "height": h})
        errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
        bad = []; page.on("response", lambda r: bad.append(r.url) if r.status >= 400 else None)
        page.goto(BASE + "welcome/"); page.wait_for_timeout(500)
        check(not errs and not bad, "%dpx wide: loads with no errors or missing files %s" % (w, bad[:2]))
        check(not page.evaluate("document.documentElement.scrollWidth > window.innerWidth"), "%dpx wide: no sideways scroll" % w)
        check(page.evaluate("[...document.images].every(i => i.complete && i.naturalWidth > 0)"), "%dpx wide: images load" % w)
    page = b.new_page(viewport={"width": 1280, "height": 900})
    page.goto(BASE + "welcome/"); page.wait_for_timeout(300)
    page.get_by_role("link", name="Open in your browser").first.click(); page.wait_for_timeout(4000)
    check(page.url == BASE and page.locator("#root").count() == 1, "'Open in your browser' goes to the app")
    page.goto(BASE + "welcome/")
    d = page.locator("details").first; d.locator("summary").click()
    check(d.evaluate("e => e.open"), "a question opens when tapped")
    check(page.get_by_role("link", name="Privacy").get_attribute("href") == "../privacy.html", "privacy link points to the privacy page")
    b.close()
print("ALL PASSED" if not failures else "FAILED: %d" % len(failures))
raise SystemExit(1 if failures else 0)
