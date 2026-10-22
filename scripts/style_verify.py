#!/usr/bin/env python3
"""Verify that every page's own class names actually have CSS, in PRODUCTION.

WHY THIS EXISTS. Commit dd8743e ("Adopt SiteShell everywhere") meant to delete
each page's duplicated nav/footer/:root CSS. On two files it deleted the whole
style block: components/GuideLayout.tsx (18,410 chars) and pages/guides/index.tsx
(4,407). /guides and every /guides/<slug> rendered as raw stacked links for TEN
DAYS, on the pages the entire SEO strategy points at.

That commit WAS verified. Its message lists "all 10 representative routes return
200 with exactly one nav logo each, every page carries the same stylesheet hash
for the nav". Every one of those checks passed while the pages were unstyled,
because each only ever asked about the nav. seo_verify.py passed too: the
markup, canonicals and metadata were all perfect.

So this asks the one question none of them did: does the CSS delivered with this
page actually contain rules for the classes the page uses?

Most of the CSS here is styled-jsx, INLINED into the HTML rather than served
from _next/static/css, so both sources are collected.

THE APP LOOK (2026-10-22). Every page now shares one system: tokens in
styles/globals.css, the .mk vocabulary in styles/wards.css, the React blocks in
styles/app.css + components/app. So each route is also held to a contract:
exactly one app-look root (.m3vp), one nav (header.sn) and one footer
(footer.foot), and the delivered CSS defines the app tokens in both themes.
A route that fails it has lost the shared chrome (an ERROR). Separately, every
Score Report palette literal or DM Sans still in a page's CSS is counted as a
WARNING: that is the porting burn-down, and it should reach zero.

Usage:
    python3 scripts/style_verify.py                      # live site
    python3 scripts/style_verify.py --base http://localhost:3111
    python3 scripts/style_verify.py --verbose            # list unstyled classes
"""
import argparse
import re
import ssl
import sys
import urllib.error
import urllib.request
from urllib.parse import urljoin

try:
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()

DEFAULT_BASE = "https://stepgunner.com"
UA = "Mozilla/5.0 (compatible; StepGunnerStyleVerify/1.0; +https://stepgunner.com)"

# One representative of every distinct LAYOUT. A layout regression hits every
# page that shares the component, so one per family is enough.
ROUTES = [
    "/",                          # WardsPage (home)
    "/wards",
    "/wards/abg-interpretation",
    "/wards/soap-note",
    "/guides",                    # SiteShell + page-local
    "/guides/pediatrics",         # GuideLayout (blocks)
    "/guides/internal-medicine",
    "/readiness",                 # SiteShell, tool measure
    "/readiness/methodology",
    "/step-2-score-predictor",
    "/research",                  # LabLayout, the research index
    "/research/nbme-to-step-2",   # LabLayout, a research post
    "/step-2-ck-percentiles",
    "/step-2-ck-emergency-medicine",
    "/partner",
    "/privacy",                   # DocLayout
    "/support",
    "/chiefs",                    # SiteShell with its own nav button
    "/pathways",                  # ED pathways hub (PathwaysHub + PwStyles)
    "/pathways/chest-pain",       # one ED pathway article (PathwayArticle + PwStyles)
]

# The shared chrome, once per page (lib/app/chrome.js renders it for every page).
SHELL = {
    "app-look root (.m3vp)": r'class="m3vp"',
    "nav (header.sn)": r'<header class="sn"',
    "footer (footer.foot)": r'<footer class="foot"',
}
# Declarations only styles/globals.css makes: the app tokens, light and dark.
TOKENS = (r"--act:\s*#0060df", r"--st-bg:\s*#070c18", r"prefers-color-scheme:\s*dark\)\s*\{\s*:root")
# The retired Score Report register: paper, ink, dim, faint, green, gold, blue, panel tint, red, DM Sans.
RETIRED = re.compile(r"#faf9f6|#191c23|#5d6470|#9aa0ab|#0d9448|#e08e00|#2f6fed|#b87400|#f3f2ee|#c0392b|DM Sans", re.I)

# Classes that legitimately carry no CSS of their own.
IGNORE_EXACT = {"active", "show", "open", "selected", "disabled", "hidden", "sr-only"}
IGNORE_PREFIX = ("jsx-",)          # styled-jsx scope hashes
MIN_CLASSES = 6                    # too few to judge
FAIL_COVERAGE = 0.50               # below this, the page is effectively unstyled
# Coverage alone is not enough. /guides carries only ~22 classes and most come
# from SiteShell, so when its OWN block died it still scored 59% and would have
# slipped through. Any page missing this many distinct classes is broken no
# matter what the ratio says; a healthy page here misses at most 2.
MAX_UNSTYLED = 5


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as r:
        return r.read().decode("utf-8", "replace")


def page_css(base: str, url: str, html: str) -> str:
    """Inline <style> blocks plus every linked stylesheet."""
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
    for href in re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html):
        try:
            css += "\n" + fetch(urljoin(url, href))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            pass
    return css


def used_classes(html: str) -> set:
    out = set()
    for attr in re.findall(r'class="([^"]*)"', html):
        for tok in attr.split():
            if tok in IGNORE_EXACT or tok.startswith(IGNORE_PREFIX):
                continue
            if re.fullmatch(r"[A-Za-z][\w-]*", tok):
                out.add(tok)
    return out


def styled(cls: str, css: str) -> bool:
    # `.card` matches ".card", ".card.live", ".card:hover", ".a .card", ".card>p"
    return re.search(r"\." + re.escape(cls) + r"(?![\w-])", css) is not None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--verbose", action="store_true")
    a = ap.parse_args()

    errors, warnings = [], []
    print(f"Style contract against {a.base}\n")
    for route in ROUTES:
        url = urljoin(a.base, route)
        try:
            html = fetch(url)
        except Exception as e:  # noqa: BLE001 - report any fetch failure as an error
            errors.append(f"{route}: unreachable ({e})")
            print(f"  FAIL  {route:34} unreachable")
            continue

        css = page_css(a.base, url, html)
        for name, pat in SHELL.items():
            n = len(re.findall(pat, html))
            if n != 1:
                errors.append(f"{route}: {n} x {name}, expected exactly 1 (the shared app-look chrome)")
        missing_tokens = [t for t in TOKENS if not re.search(t, css)]
        if missing_tokens:
            errors.append(f"{route}: the app tokens are not in this page's CSS ({len(missing_tokens)} of {len(TOKENS)} missing)")
        retired = RETIRED.findall(css)
        if retired:
            warnings.append(f"{route}: {len(retired)} Score Report literal(s) left in page CSS "
                            f"({', '.join(sorted(set(x.lower() for x in retired)))}): port to the app tokens")
        classes = used_classes(html)
        if len(classes) < MIN_CLASSES:
            print(f"  skip  {route:34} only {len(classes)} classes")
            continue

        missing = sorted(c for c in classes if not styled(c, css))
        cov = 1 - len(missing) / len(classes)
        mark = "ok  "
        if cov < FAIL_COVERAGE or len(missing) > MAX_UNSTYLED:
            mark = "FAIL"
            errors.append(
                f"{route}: {len(missing)} of {len(classes)} classes have NO CSS "
                f"({cov:.0%} styled) - unstyled: {', '.join(missing[:10])}"
            )
        elif missing:
            warnings.append(f"{route}: {len(missing)} unstyled class(es): {', '.join(missing[:8])}")
        print(f"  {mark}  {route:34} {cov:5.0%} of {len(classes):3} classes styled, "
              f"{len(css):6} bytes CSS")
        if a.verbose and missing:
            print(f"          unstyled: {', '.join(missing)}")

    print()
    for w in warnings:
        print(f"  warn  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    print(f"\n{len(ROUTES) - len(errors)}/{len(ROUTES)} routes styled. "
          f"{len(errors)} error(s), {len(warnings)} warning(s).")
    if errors:
        print("Deploy gate: FAIL")
        return 1
    print("Deploy gate: PASS" + (" (warnings only)" if warnings else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
