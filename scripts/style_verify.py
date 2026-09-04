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
    "/",
    "/guides",
    "/guides/pediatrics",
    "/guides/internal-medicine",
    "/readiness",
    "/readiness/methodology",
    "/step-2-score-predictor",
    "/research/nbme-to-step-2",   # /research itself has no index page
    "/step-2-ck-percentiles",
    "/partner",
]

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
