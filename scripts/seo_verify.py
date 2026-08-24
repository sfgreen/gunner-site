#!/usr/bin/env python3
"""Verify the SEO contract against PRODUCTION HTML, not the source.

The source can be right while the deployed page is wrong: a component refactor
moves a <Head>, a layout swap drops a canonical, a rewrite starts redirecting.
This fetches what Google actually gets and fails loudly on the differences that
cost rankings.

Usage:
    python3 scripts/seo_verify.py                        # live site
    python3 scripts/seo_verify.py --base <preview-url>   # a Vercel preview

ERRORs block a deploy: the page is unreachable, uncrawlable, or competing with
itself. WARNs are reported but do not block: cosmetic SERP truncation and
missing unfurl art on pages nobody shares. A gate that fails on every deploy
gets ignored, so the split is the point.
"""

import argparse
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from urllib.parse import urljoin, urlparse, urlunparse

try:
    import certifi
    SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CONTEXT = ssl.create_default_context()

DEFAULT_BASE = "https://stepgunner.com"
UA = "Mozilla/5.0 (compatible; StepGunnerSEOVerify/1.0; +https://stepgunner.com)"

# Pages whose canonical intentionally differs from the fetched URL. /readiness
# takes a ?e= share payload; every share must consolidate onto the bare page
# instead of becoming its own indexable near-duplicate.
CANONICAL_EXCEPTIONS = {"/readiness"}

# Live routes deliberately kept out of the sitemap. Anything else that serves a
# page but is not listed is drift, not a decision: the static half of the
# sitemap is hand-maintained (only the guides are generated), so new pages are
# easy to forget. Add a route here to declare the omission on purpose.
SITEMAP_EXCLUDED = {
    "/embed",     # widget iframe, has no standalone value in search
    "/partner",   # study-partner invite landing, reached only by code
    "/admin",     # operator surface
}

TITLE_MAX = 65
DESC_MIN, DESC_MAX = 70, 165


def fetch(url):
    """Return (final_url, status, headers, body). Redirects are followed."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as resp:
            return resp.geturl(), resp.status, dict(resp.headers), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return url, exc.code, dict(exc.headers or {}), ""
    except (urllib.error.URLError, TimeoutError, ssl.SSLError) as exc:
        return url, 0, {}, f"__FETCH_ERROR__ {exc}"


def tag(pattern, html):
    match = re.search(pattern, html, re.I | re.S)
    return match.group(1).strip() if match else None


def strip_markup(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()


def normalize(url, path_only=False):
    """Compare URLs without caring about trailing slash or query/fragment.

    On a preview or local origin, canonicals still point at production by design,
    so compare paths only rather than false-failing every page."""
    parts = urlparse(url)
    path = parts.path.rstrip("/") or "/"
    if path_only:
        return path
    return urlunparse((parts.scheme, parts.netloc, path, "", "", ""))


def sitemap_urls(base):
    url = urljoin(base, "/sitemap.xml")
    _, status, headers, body = fetch(url)
    if status != 200:
        sys.exit(f"FATAL: {url} returned {status}; nothing to verify.")
    ctype = headers.get("Content-Type", "")
    if "xml" not in ctype.lower():
        sys.exit(f"FATAL: {url} served as '{ctype}', not XML. Google will not parse it.")
    locs = re.findall(r"<loc>\s*(.*?)\s*</loc>", body, re.I | re.S)
    if not locs:
        sys.exit(f"FATAL: {url} parsed but contains no <loc> entries.")
    return locs


def check_page(url, base, static_dirs=frozenset()):
    """Return (errors, warnings, facts) for one URL."""
    preview = base.rstrip("/") != DEFAULT_BASE
    if preview and (urlparse(url).path.rstrip("/") or "/") in static_dirs:
        return [], ["static public/ dir: a dev server cannot serve it, verified in production only"], {}
    fails, warns = [], []
    final_url, status, headers, html = fetch(url)

    if html.startswith("__FETCH_ERROR__"):
        return [f"unreachable: {html.removeprefix('__FETCH_ERROR__ ')}"], [], {}
    if status != 200:
        return [f"HTTP {status}"], [], {}
    if normalize(final_url) != normalize(url):
        fails.append(f"redirects to {final_url} (a sitemap URL must be the destination, not a hop)")

    xrobots = headers.get("X-Robots-Tag", "")
    if "noindex" in xrobots.lower():
        fails.append(f"X-Robots-Tag header says noindex: '{xrobots}'")

    title = tag(r"<title[^>]*>(.*?)</title>", html)
    if not title:
        fails.append("no <title>")
    elif len(title) > TITLE_MAX:
        warns.append(f"title is {len(title)} chars, truncates past ~{TITLE_MAX}")

    desc = tag(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html)
    if not desc:
        fails.append("no meta description")
    elif not DESC_MIN <= len(desc) <= DESC_MAX:
        warns.append(f"meta description is {len(desc)} chars, outside {DESC_MIN}-{DESC_MAX}")

    canonicals = re.findall(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\'](.*?)["\']', html, re.I)
    canonical = canonicals[0].strip() if canonicals else None
    if not canonical:
        fails.append("no canonical")
    elif len(canonicals) > 1:
        fails.append(f"{len(canonicals)} canonicals; Google ignores all of them")
    elif not canonical.startswith("http"):
        fails.append(f"canonical is relative: '{canonical}'")
    elif urlparse(url).path.rstrip("/") not in CANONICAL_EXCEPTIONS:
        if normalize(canonical, preview) != normalize(url, preview):
            fails.append(f"canonical points at {canonical}, not itself")

    robots = tag(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\'](.*?)["\']', html)
    if robots and "noindex" in robots.lower():
        fails.append(f"meta robots says noindex: '{robots}'")

    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    if not h1s:
        fails.append("no <h1>")
    elif len(h1s) > 1:
        fails.append(f"{len(h1s)} <h1> tags")
    elif not strip_markup(h1s[0]):
        fails.append("<h1> is empty")

    if not tag(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](.*?)["\']', html):
        warns.append("no og:image (link unfurls render bare)")

    return fails, warns, {"title": title, "desc": desc, "canonical": canonical}


def discover_routes(repo_root):
    """Every route this repo actually serves: Next pages plus static public/ dirs."""
    routes = set()

    pages = os.path.join(repo_root, "pages")
    for dirpath, _, filenames in os.walk(pages):
        if os.path.join("pages", "api") in dirpath:
            continue
        for name in filenames:
            if not name.endswith(".tsx") or name.startswith("_"):
                continue
            rel = os.path.relpath(os.path.join(dirpath, name), pages)
            route = "/" + rel[: -len(".tsx")].replace(os.sep, "/")
            route = route.removesuffix("/index")
            if "[" in route or route.endswith(".xml"):
                continue  # dynamic routes come from the generator; sitemap.xml is not a page
            routes.add(route or "/")

    routes |= static_dir_routes(repo_root)
    return routes


def static_dir_routes(repo_root):
    """Routes served straight out of public/<name>/index.html."""
    public = os.path.join(repo_root, "public")
    if not os.path.isdir(public):
        return set()
    return {f"/{name}" for name in sorted(os.listdir(public))
            if os.path.isfile(os.path.join(public, name, "index.html"))}


def check_sitemap_coverage(repo_root, listed_paths):
    """Live routes absent from the sitemap: Google is never told they exist."""
    fails = []
    for route in sorted(discover_routes(repo_root)):
        if route in SITEMAP_EXCLUDED or route.rstrip("/") in listed_paths:
            continue
        fails.append(f"{route} is live but absent from the sitemap "
                     f"(list it, or add it to SITEMAP_EXCLUDED to declare the omission)")
    return fails


def check_cannibalization(facts):
    """Duplicate titles/descriptions across URLs means pages competing for one query."""
    fails = []
    for label, key in (("title", "title"), ("meta description", "desc")):
        groups = defaultdict(list)
        for url, data in facts.items():
            value = data.get(key)
            if value:
                groups[value.lower()].append(url)
        for value, urls in groups.items():
            if len(urls) > 1:
                fails.append(f"{len(urls)} pages share a {label} ({value[:60]}...): {', '.join(urls)}")

    targets = defaultdict(list)
    for url, data in facts.items():
        canonical = data.get("canonical")
        if canonical and normalize(canonical) != normalize(url):
            targets[normalize(canonical)].append(url)
    for target, urls in targets.items():
        if len(urls) > 1:
            fails.append(f"{len(urls)} sitemap URLs canonicalize away to {target}: {', '.join(urls)}")
    return fails


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default=DEFAULT_BASE, help="origin to verify (default: the live site)")
    args = parser.parse_args()
    base = args.base.rstrip("/")

    urls = sitemap_urls(base)
    if base != DEFAULT_BASE:
        urls = [urljoin(base, urlparse(u).path) for u in urls]

    print(f"Verifying {len(urls)} sitemap URLs against {base}\n")

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dirs = static_dir_routes(repo_root)

    facts, failures, warnings = {}, {}, {}
    for url in urls:
        fails, warns, data = check_page(url, base, static_dirs)
        path = urlparse(url).path or "/"
        if data:
            facts[path] = data
        if fails:
            failures[path] = fails
        if warns:
            warnings[path] = warns
        label = "ERROR" if fails else ("warn " if warns else "ok   ")
        print(f"  {label} {path}")
        for fail in fails:
            print(f"          ERROR: {fail}")
        for warn in warns:
            print(f"          warn:  {warn}")

    listed = {(urlparse(u).path or "/").rstrip("/") for u in urls}
    site_fails = check_sitemap_coverage(repo_root, listed) + check_cannibalization(facts)
    if site_fails:
        print("\nSite-wide:")
        for fail in site_fails:
            print(f"  FAIL  - {fail}")

    errors = sum(len(v) for v in failures.values()) + len(site_fails)
    warn_count = sum(len(v) for v in warnings.values())
    clean = len(urls) - len(set(failures) | set(warnings))
    print(f"\n{clean}/{len(urls)} pages clean. {errors} error(s), {warn_count} warning(s).")
    if errors:
        print("Deploy gate: FAIL")
    else:
        print("Deploy gate: PASS" + (" (warnings only)" if warn_count else ""))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
