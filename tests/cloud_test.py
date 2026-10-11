"""Checks cloud sync to Dropbox and Google Drive, with pretend servers (nothing real is contacted).

    python3 tests/cloud_test.py

Run `npm run build` first. On the website: choose Dropbox, "sign in" (a pretend sign-in page sends
the browser back), the deck is saved to a pretend app folder; a second pretend device signs in and
receives the card. Then the same with Google Drive. Also: choices hidden until set up, sign out.
"""
import os, json, threading, http.server, functools, socketserver, urllib.parse
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

CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*"}
GET = """(k) => new Promise((res) => { const r = indexedDB.open('dansk'); r.onsuccess = () => {
  const g = r.result.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result === undefined ? null : g.result); g.onerror = () => res(null); }; r.onerror = () => res(null); })"""

store = {"dropbox": None, "google": None}
calls = []

def fake_services(ctx):
    def dropbox_auth(route):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(route.request.url).query)
        calls.append("dropbox-auth")
        ok = q.get("code_challenge_method") == ["S256"] and q.get("client_id") == ["dbkey"] and q.get("token_access_type") == ["offline"]
        if not ok: calls.append("BAD-DROPBOX-AUTH")
        back = q["redirect_uri"][0] + "?code=dbcode&state=" + q["state"][0]
        route.fulfill(status=302, headers={"location": back})
    ctx.route("https://www.dropbox.com/oauth2/authorize*", dropbox_auth)

    def dropbox_token(route):
        body = urllib.parse.parse_qs(route.request.post_data or "")
        calls.append("dropbox-token:" + (body.get("grant_type") or [""])[0])
        if route.request.method == "OPTIONS": return route.fulfill(status=204, headers=CORS)
        if (body.get("grant_type") or [""])[0] == "authorization_code" and not body.get("code_verifier"): calls.append("BAD-VERIFIER")
        route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"access_token": "dbtoken", "refresh_token": "dbrefresh", "expires_in": 14400}))
    ctx.route("https://api.dropboxapi.com/oauth2/token", dropbox_token)

    def dropbox_files(route):
        r = route.request
        if r.method == "OPTIONS": return route.fulfill(status=204, headers=CORS)
        if r.headers.get("authorization") != "Bearer dbtoken": return route.fulfill(status=401, headers=CORS, body="{}")
        if r.url.endswith("/download"):
            if store["dropbox"] is None: return route.fulfill(status=409, headers=CORS, body="{}")
            return route.fulfill(status=200, headers=CORS, content_type="text/plain", body=store["dropbox"])
        store["dropbox"] = r.post_data
        calls.append("dropbox-upload")
        route.fulfill(status=200, headers=CORS, content_type="application/json", body="{}")
    ctx.route("https://content.dropboxapi.com/2/files/*", dropbox_files)

    def drive(route):
        r = route.request
        if r.method == "OPTIONS": return route.fulfill(status=204, headers=CORS)
        if r.headers.get("authorization") != "Bearer gtoken": return route.fulfill(status=401, headers=CORS, body="{}")
        url = r.url
        if "/upload/drive/v3/files" in url:
            body = r.post_data or ""
            if "multipart" in url:
                body = body.split("\r\n\r\n", 2)[-1].rsplit("\r\n--", 1)[0]
            store["google"] = body
            calls.append("google-upload")
            return route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"id": "file1"}))
        if "alt=media" in url:
            return route.fulfill(status=200, headers=CORS, content_type="application/json", body=store["google"] or "")
        files = [{"id": "file1"}] if store["google"] is not None else []
        route.fulfill(status=200, headers=CORS, content_type="application/json", body=json.dumps({"files": files}))
    ctx.route("https://www.googleapis.com/**", drive)

# Google's own sign-in script, pretended.
GIS = """
window.google = { accounts: { oauth2: { initTokenClient: (o) => ({ requestAccessToken: () => setTimeout(() => o.callback({ access_token: 'gtoken', expires_in: 3600 }), 50) }) } } };
"""
CONFIG = "window.__BROEN_CLOUD__ = { dropboxAppKey: 'dbkey', googleWebClientId: 'gid.apps.googleusercontent.com' };"

def device(browser, config=True, gis=True):
    ctx = browser.new_context(viewport={"width": 400, "height": 900})
    ctx.add_init_script(CONFIG if config else "window.__BROEN_CLOUD__ = { dropboxAppKey: '', googleWebClientId: '', googleIosClientId: '' };")
    if gis: ctx.add_init_script(GIS)
    fake_services(ctx)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_timeout(5500)
    return ctx, page, errors

def open_sync(page):
    page.get_by_role("button", name="Backup and sync").click(); page.wait_for_timeout(500)
    page.get_by_role("button", name="Sync", exact=True).click(); page.wait_for_timeout(400)

def add_card(page, front, back):
    page.keyboard.press("Escape"); page.wait_for_timeout(200)
    page.keyboard.press("Escape"); page.wait_for_timeout(200)
    page.get_by_role("button", name="Add").last.click(); page.wait_for_timeout(500)
    page.get_by_label("Dansk", exact=True).fill(front)
    page.get_by_label("English", exact=True).fill(back)
    page.get_by_role("button", name="Add card").click(); page.wait_for_timeout(1200)

def has_card(page, front):
    cards = json.loads(page.evaluate(GET, "cards") or "[]")
    return any(c.get("front") == front for c in cards)

with sync_playwright() as p:
    browser = p.chromium.launch()

    # Not set up: nothing is offered.
    ctx, page, errors = device(browser, config=False, gis=False)
    page.get_by_role("button", name="Backup and sync").click(); page.wait_for_timeout(400)
    check(page.get_by_role("button", name="Sync", exact=True).count() == 0, "with no Google or Dropbox set up, no Sync row is offered")
    ctx.close()

    # Dropbox: device A signs in and saves; device B signs in and receives the card.
    ctx, page, errors = device(browser)
    add_card(page, "zzyxdrop", "zzyx dropbox")
    open_sync(page)
    check(page.get_by_role("button", name="Dropbox", exact=True).count() == 1 and page.get_by_role("button", name="Google Drive", exact=True).count() == 1, "the choices are Dropbox, Google Drive and Off")
    check(page.get_by_role("button", name="iCloud", exact=True).count() == 0, "iCloud is not offered on the website")
    page.get_by_role("button", name="Dropbox", exact=True).click(); page.wait_for_timeout(7000)
    check("dropbox-auth" in calls and "BAD-DROPBOX-AUTH" not in calls, "Dropbox sign-in is started the safe (PKCE, offline) way")
    check("dropbox-token:authorization_code" in calls and "BAD-VERIFIER" not in calls, "the code is exchanged with its secret check")
    check(page.evaluate(GET, "syncProvider") == "dropbox", "Dropbox is remembered as the sync place")
    check("code=" not in page.url, "the sign-in code is removed from the address")
    check(store["dropbox"] is not None and "zzyxdrop" in store["dropbox"], "the deck was saved to the Dropbox app folder")
    check("dbtoken" not in (page.evaluate(GET, "cards") or ""), "the token is not inside the cards")
    check(not errors, "device A: no page errors: %s" % errors)
    ctx.close()

    ctx, page, errors = device(browser)
    open_sync(page)
    page.get_by_role("button", name="Dropbox", exact=True).click(); page.wait_for_timeout(8000)
    check(has_card(page, "zzyxdrop"), "a second device receives the card from Dropbox")
    open_sync(page); page.wait_for_timeout(300)
    check("Last synced" in page.inner_text("body"), "the last sync time is shown")
    page.get_by_role("button", name="Sign out of Dropbox").click(); page.wait_for_timeout(600)
    check(page.evaluate(GET, "syncProvider") in ("", None), "signing out turns sync off")
    check(page.evaluate(GET, "cloudToken_dropbox") is None, "signing out removes the token")
    ctx.close()

    # Google Drive: A saves, B receives.
    ctx, page, errors = device(browser)
    add_card(page, "zzyxgoog", "zzyx google")
    open_sync(page)
    page.get_by_role("button", name="Google Drive", exact=True).click(); page.wait_for_timeout(7000)
    check(page.evaluate(GET, "syncProvider") == "google", "Google Drive is remembered as the sync place")
    check(store["google"] is not None and "zzyxgoog" in store["google"], "the deck was saved to the hidden Google Drive app folder")
    check(not errors, "Google device A: no page errors: %s" % errors)
    ctx.close()

    ctx, page, errors = device(browser)
    open_sync(page)
    page.get_by_role("button", name="Google Drive", exact=True).click(); page.wait_for_timeout(8000)
    check(has_card(page, "zzyxgoog"), "a second device receives the card from Google Drive")
    check(not errors, "Google device B: no page errors: %s" % errors)
    ctx.close()
    browser.close()

print("\nALL PASSED" if not failures else "\nFAILED: %s" % failures)
raise SystemExit(1 if failures else 0)
