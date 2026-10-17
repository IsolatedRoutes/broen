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
check(all(f'id="{i}"' in html for i in ("get", "questions", "how")), "the page has How it works, On your phone and Questions sections")
check("Add to Home Screen" in html and "Install app" in html and "install</b> icon" in html, "install steps for iPhone, Android and computer are shown")
check(len(faq_q) >= 6 and len(re.findall(r'class="qa"', html)) == len(faq_q), "the visible questions match the structured-data questions")
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
    page.get_by_role("link", name="Use in your browser").first.click(); page.wait_for_timeout(4000)
    check(page.url == BASE and page.locator("#root").count() == 1, "'Use in your browser' goes to the app")
    page.goto(BASE + "welcome/")
    check(page.locator(".qa").count() >= 6 and page.locator(".qa p").first.is_visible(), "the questions and their answers are visible without tapping")
    check(page.get_by_role("link", name="Privacy", exact=True).get_attribute("href") == "../privacy.html", "privacy link points to the privacy page")
    # the menu opens real pages, and the pages hold the app's full text
    nav = {a.inner_text().strip(): a.get_attribute("href") for a in page.locator("header nav a.plain").all()}
    check(nav.get("How it works") == "how-it-works/" and nav.get("FAQ") == "faq/" and nav.get("About") == "about/", "menu links go to real pages, not lower down the same page")
    check(page.locator("a.applink").count() >= 4 and all(a.get_attribute("href") == "../" for a in page.locator("a.applink").all()), "every 'open Broen' is a highlighted link to the app")
    for d, needle in [("how-it-works", "Backup and sync"), ("faq", "How do I move to a new device?"), ("about", "The Bridge"), ("terms", "A learning aid")]:
        r = page.goto(BASE + "welcome/%s/" % d); page.wait_for_timeout(200)
        check(r.status == 200 and needle in page.content(), "welcome/%s/ opens and has the app's text" % d)
    info = open(os.path.join(ROOT, "src", "data", "infoPages.js"), encoding="utf-8").read()
    faq_page = open(os.path.join(ROOT, "welcome", "faq", "index.html"), encoding="utf-8").read()
    base_faq = info.split('id: "faq"')[1].split("];")[0]
    check(faq_page.count("<section id=") == len(re.findall(r"^      \[\"", base_faq, re.M)), "the FAQ page has every question the app has")
    check("in this menu" not in faq_page and "in this menu" not in open(os.path.join(ROOT, "welcome", "how-it-works", "index.html"), encoding="utf-8").read(), "no app-menu wording left on the website pages")
    b.close()
print("ALL PASSED" if not failures else "FAILED: %d" % len(failures))
raise SystemExit(1 if failures else 0)
