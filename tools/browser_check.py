"""Opens every page of the built site in a real browser (Chromium) at phone, tablet and
desktop widths and checks: no sideways scrolling, fonts load, only the approved fonts and
weights are used, no italics, text contrast, button sizes, no console errors or failed
requests, and that the menu, filters, gallery viewer and enquiry form really work.

Run:  python3 -I tools/browser_check.py            (build first: node build.mjs)
Screenshots go to build-notes/shots/."""
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
SHOTS = os.path.join(ROOT, "build-notes", "shots")
os.makedirs(SHOTS, exist_ok=True)
PORT = 8765
BASE = f"http://127.0.0.1:{PORT}"
WIDTHS = [320, 375, 640, 768, 1024, 1440]
PAGES = [
    "/", "/his-story/", "/journeys/", "/journeys/walk-for-education/", "/journeys/faith-in-motion/",
    "/journeys/peace-walk-nakivale-makerere/", "/journeys/ishekye-sheema-walk/", "/journeys/busia-trek/",
    "/journeys/earlier-walks/", "/field-notes/", "/gallery/", "/media/", "/get-involved/", "/privacy/", "/no-such-page/",
]
SHOT_PAGES = {"/": [375, 768, 1440], "/journeys/": [375, 1440], "/journeys/walk-for-education/": [375, 1440],
              "/journeys/faith-in-motion/": [375, 1440], "/gallery/": [375, 1440], "/get-involved/": [375, 1440],
              "/his-story/": [375, 1440], "/media/": [1440], "/field-notes/": [375, 1440]}

PERF_INIT = """
window.__perf = {cls: 0, lcp: 0};
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
new PerformanceObserver(l => { const e = l.getEntries().pop(); if (e) window.__perf.lcp = e.startTime; }).observe({type: 'largest-contentful-paint', buffered: true});
"""

PAGE_JS = """
() => {
  const de = document.documentElement, out = {};
  out.overflow = de.scrollWidth - de.clientWidth;
  if (out.overflow > 0) out.wide = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > de.clientWidth + 1).slice(0, 4).map(e => e.tagName + '.' + e.className);
  out.fontsOk = ['700 16px "WR Brighter Sans"', '400 16px "WR Sky Text"', '700 16px "WR Sky Text"'].map(f => document.fonts.check(f));
  out.loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '') + ' ' + f.weight);
  const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = s => { const m = s.match(/[\\d.]+/g).map(Number); return {r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1}; };
  const bgOf = el => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.5) return [c.r, c.g, c.b]; e = e.parentElement; } return [243, 239, 230]; };
  const used = {}, low = [], lightSmall = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement, cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden],noscript,script,style,template')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.width <= 1) continue;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const key = fam + ' | ' + cs.fontWeight + ' | ' + cs.fontStyle + ' | ' + (el.closest('h1,h2,h3,h4,h5,h6') ? 'heading' : 'text');
    used[key] = (used[key] || 0) + 1;
    const fg = parse(cs.color), bg = bgOf(el);
    const lf = lum([fg.r, fg.g, fg.b]), lb = lum(bg);
    const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    if (cs.fontWeight === '300' && size < 23.5) lightSmall.push(n.nodeValue.trim().slice(0, 30) + ' ' + size + 'px');
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) low.push(n.nodeValue.trim().slice(0, 36) + ' (' + ratio.toFixed(2) + ' need ' + need + ', ' + size + 'px)');
  }
  out.used = used; out.low = [...new Set(low)].slice(0, 6); out.lightSmall = [...new Set(lightSmall)].slice(0, 4);
  out.small = [...document.querySelectorAll('.button, button, input:not([type=checkbox]):not([tabindex="-1"]), select, textarea, .filter-btn, .menu-toggle, .primary-nav__list a, summary')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 43.5 && !e.closest('[hidden]'); })
    .map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().height)).slice(0, 5);
  out.h1 = document.querySelectorAll('h1').length;
  return out;
}
"""

problems, info = [], []


def bad(msg):
    problems.append(msg)



def settle(page):
    """Wait for the page loader to finish and show every scroll-revealed block."""
    page.wait_for_function("!document.querySelector('.preloader')", timeout=8000)
    page.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))")
    page.wait_for_timeout(900)


def main():
    srv = subprocess.Popen(["node", os.path.join(ROOT, "tools", "serve.mjs"), DIST, str(PORT)], stdout=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            seen_type = {}
            for w in WIDTHS:
                ctx = browser.new_context(viewport={"width": w, "height": 900})
                ctx.add_init_script(PERF_INIT)
                for path in PAGES:
                    page = ctx.new_page()
                    errs = []
                    page.on("console", lambda m, errs=errs: errs.append(m.text) if m.type in ("error", "warning") else None)
                    page.on("pageerror", lambda e, errs=errs: errs.append("pageerror " + str(e)))
                    page.on("response", lambda r, errs=errs: errs.append(f"HTTP {r.status} {r.url}") if r.status >= 400 and "no-such-page" not in r.url else None)
                    page.on("requestfailed", lambda r, errs=errs: errs.append("failed " + r.url))
                    page.goto(BASE + path, wait_until="networkidle")
                    page.evaluate("document.fonts.ready")
                    try:
                        settle(page)
                    except Exception:
                        bad(f"{path} @{w}: the page loader did not go away")
                    page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager')")
                    page.wait_for_load_state("networkidle")
                    # wait until every picture is loaded and decoded, so screenshots are complete
                    page.evaluate("Promise.all([...document.images].map(i => i.decode().catch(() => null)))")
                    r = page.evaluate(PAGE_JS)
                    tag = f"{path} @{w}"
                    broken = page.evaluate("[...document.images].filter(i => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map(i => i.currentSrc || i.src)")
                    if broken:
                        bad(f"{tag}: pictures that did not load {broken}")
                    if path == "/no-such-page/":
                        errs[:] = [e for e in errs if "404" not in e]  # the 404 page is meant to answer with 404
                    if r["overflow"] > 0:
                        bad(f"{tag}: sideways scroll {r['overflow']}px {r.get('wide')}")
                    if not all(r["fontsOk"]):
                        bad(f"{tag}: font check {r['fontsOk']}")
                    if r["lightSmall"]:
                        bad(f"{tag}: Sky Light used below 24px {r['lightSmall']}")
                    if r["low"]:
                        bad(f"{tag}: low contrast {r['low']}")
                    if r["small"]:
                        bad(f"{tag}: small targets {r['small']}")
                    if r["h1"] != 1:
                        bad(f"{tag}: h1 count {r['h1']}")
                    for k, v in r["used"].items():
                        seen_type[k] = seen_type.get(k, 0) + v
                    for e in errs:
                        bad(f"{tag}: {e}")
                    if path == "/" and w in (375, 1440):
                        perf = page.evaluate("window.__perf")
                        info.append(f"home @{w}: CLS {perf['cls']:.3f}, LCP {perf['lcp'] / 1000:.2f}s (local server)")
                    if w in SHOT_PAGES.get(path, []):
                        name = ("home" if path == "/" else path.strip("/").replace("/", "-")) + f"-{w}.png"
                        page.screenshot(path=os.path.join(SHOTS, name), full_page=True)
                    page.close()
                ctx.close()
            info.append("type in use (family | weight | style | role): " + json.dumps(seen_type, indent=1))
            for k in seen_type:
                fam, wt, st, role = [x.strip() for x in k.split("|")]
                if st != "normal":
                    bad(f"italic or oblique text found: {k}")
                if role == "heading" and fam != "WR Brighter Sans":
                    bad(f"a heading is not in Brighter Sans: {k}")
                if role == "text" and fam == "WR Brighter Sans":
                    bad(f"Brighter Sans used outside headings: {k}")

            # ---- interactions -------------------------------------------------
            try:
                interactions(browser)
            except Exception as e:  # report instead of crashing, so the matrix results still print
                bad(f"interaction tests stopped early: {str(e).splitlines()[0]}")
            browser.close()
    finally:
        srv.terminate()

    print("\n".join(info))
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for p in problems[:60]:
            print(" - " + p)
        sys.exit(1)
    print("\nBrowser checks passed.")


def interactions(browser):
    if True:
        if True:
            ctx = browser.new_context(viewport={"width": 375, "height": 800})
            page = ctx.new_page()
            page.goto(BASE + "/", wait_until="networkidle")
            settle(page)
            tg = page.locator(".menu-toggle")
            tg.click()
            if page.get_attribute(".menu-toggle", "aria-expanded") != "true" or not page.locator("#site-menu").is_visible():
                bad("menu: did not open on phone")
            page.keyboard.press("Escape")
            if page.get_attribute(".menu-toggle", "aria-expanded") != "false":
                bad("menu: Escape did not close")
            if not page.evaluate("document.activeElement.classList.contains('menu-toggle')"):
                bad("menu: focus not returned to the Menu button")
            ctx.close()

            ctx = browser.new_context(viewport={"width": 1440, "height": 900})
            page = ctx.new_page()
            page.goto(BASE + "/journeys/", wait_until="networkidle")
            settle(page)
            total = page.locator(".jrow:visible").count()
            page.click('.filter-btn[data-attr="topic"][data-value="peace"]')
            peace = page.locator(".jrow:visible").count()
            page.click('.filter-btn[data-attr="topic"][data-value="*"]')
            page.click('.filter-btn[data-attr="status"][data-value="proposed"]')
            proposed = page.locator(".jrow:visible").count()
            page.click('.filter-btn[data-attr="status"][data-value="underway"]')
            underway = page.locator(".jrow:visible").count()
            info.append(f"journeys filter: all {total}, peace {peace}, proposed {proposed}, underway {underway}")
            if (peace, proposed, underway) != (1, 1, 1) or total < 8:
                bad(f"journeys filter wrong: {(total, peace, proposed, underway)}")

            page.goto(BASE + "/gallery/", wait_until="networkidle")

            settle(page)
            first = page.locator(".tile").first
            first.click()
            if not page.evaluate("document.getElementById('viewer').open"):
                bad("gallery: viewer did not open")
            t1 = page.inner_text("#viewer-title")
            page.keyboard.press("ArrowRight")
            t2 = page.inner_text("#viewer-title")
            if t1 == t2:
                bad("gallery: arrow key did not move to the next picture")
            page.keyboard.press("Escape")
            if page.evaluate("document.getElementById('viewer').open"):
                bad("gallery: Escape did not close the viewer")
            if not page.evaluate("document.activeElement.classList.contains('tile')"):
                bad("gallery: focus not returned to a tile")
            n_all = page.locator(".tile-wrap:visible").count()
            page.click('.filter-btn[data-value="artwork"]')
            n_art = page.locator(".tile-wrap:visible").count()
            info.append(f"gallery filter: all photographs {n_all}, campaign artwork {n_art}")
            if n_art != 1:
                bad("gallery: artwork filter should show exactly 1")

            page.goto(BASE + "/get-involved/", wait_until="networkidle")

            settle(page)
            page.click('.enquiry button[type="submit"]')
            invalid = page.locator(".field.is-invalid").count()
            if invalid < 5:
                bad(f"form: expected 5 invalid fields on empty send, got {invalid}")
            page.fill("#f-name", "Test Visitor")
            page.fill("#f-email", "visitor@example.org")
            page.select_option("#f-type", "host")
            page.fill("#f-msg", "Please visit our school.")
            page.check("#f-consent")
            # endpoint mode, answering ok then failing
            page.evaluate("document.querySelector('form.enquiry').setAttribute('data-endpoint', '/fake-endpoint')")
            page.route("**/fake-endpoint", lambda route: route.fulfill(status=200, body='{"ok":true}', content_type="application/json"))
            page.click('.enquiry button[type="submit"]')
            page.wait_for_selector("#form-status:has-text('Delivered')", timeout=4000)
            page.fill("#f-name", "Test Visitor")
            page.fill("#f-email", "visitor@example.org")
            page.select_option("#f-type", "host")
            page.fill("#f-msg", "Second try.")
            page.check("#f-consent")
            page.unroute("**/fake-endpoint")
            page.route("**/fake-endpoint", lambda route: route.fulfill(status=500, body="no"))
            page.click('.enquiry button[type="submit"]')
            page.wait_for_selector("#form-status:has-text('Not delivered')", timeout=4000)
            # mailto mode
            page.evaluate("document.querySelector('form.enquiry').setAttribute('data-endpoint', '')")
            page.click('.enquiry button[type="submit"]')
            page.wait_for_selector("#form-status:has-text('Nothing has been sent yet')", timeout=4000)
            info.append("form: empty send shows errors; delivered, not-delivered and email-app messages all appear")
            # donate: empty send is refused; a good one builds the WhatsApp message for the right number
            page.evaluate("window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }")
            page.click('.donate-form button[type="submit"]')
            if page.locator(".donate-form .field.is-invalid").count() != 2:
                bad("donate: expected 2 invalid fields on empty send")
            page.click('.amt[data-amt="50000"]')
            if page.locator(".donate-form .field__error").count() != 1:
                bad("donate: amount error should clear when a suggested amount is picked")
            page.fill("#p-name", "Test Person")
            page.click('.donate-form button[type="submit"]')
            opened = [u for u in page.evaluate("window.__opened") if u and "wa.me" in u]
            from urllib.parse import urlparse, parse_qs
            if len(opened) != 1 or not opened[0].startswith("https://wa.me/256757112376?text="):
                bad(f"donate: WhatsApp link wrong: {opened}")
            else:
                text = parse_qs(urlparse(opened[0]).query)["text"][0]
                for need in ("Test Person", "UGX 50,000", "Mbanda Shyaka"):
                    if need not in text:
                        bad(f"donate: message is missing {need!r}")
            info.append("donate: empty send refused; good send opens wa.me with name, amount and message")
            ctx.close()


main()
