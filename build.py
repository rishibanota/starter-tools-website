from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from html import escape
from datetime import datetime, timezone

from content import SITE, TOOLS, PAGES

ROOT = Path(__file__).parent
SRC = ROOT / "src"
PUBLIC = ROOT / "public"
ASSETS = SRC / "assets"
TOOL_MAP = {tool["id"]: tool for tool in TOOLS}


def load_runtime_config() -> dict:
    default_config = {
        "site_name": SITE["name"],
        "base_url": SITE["base_url"],
        "support_email": SITE["email"],
        "adsense_client": "",
        "enable_auto_ads": False,
        "enable_manual_placeholders": True,
        "brand_color": SITE["brand_color"],
    }
    config_path = ROOT / "site_config.json"
    if config_path.exists():
        with config_path.open("r", encoding="utf-8") as f:
            user_config = json.load(f)
        default_config.update(user_config)
    return default_config


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_assets() -> None:
    target = PUBLIC / "assets"
    target.mkdir(parents=True, exist_ok=True)
    for file_name in ["styles.css", "app.js", "favicon.svg"]:
        shutil.copy2(ASSETS / file_name, target / file_name)


def write_site_config(config: dict) -> None:
    js = "window.SITE_CONFIG = " + json.dumps(config, indent=2) + ";\n"
    (PUBLIC / "assets" / "site-config.js").write_text(js, encoding="utf-8")


def page_url(path: str) -> str:
    base = RUNTIME["base_url"].rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return base + path


def nav_links() -> str:
    return "".join(
        [
            '<a href="/">Home</a>',
            '<a href="/category/developer/">Developer</a>',
            '<a href="/category/image/">Image</a>',
            '<a href="/category/calculators/">Calculators</a>',
            '<a href="/about/">About</a>',
        ]
    )


def footer_links() -> str:
    return "".join(
        [
            '<a href="/about/">About</a>',
            '<a href="/privacy/">Privacy</a>',
            '<a href="/terms/">Terms</a>',
            '<a href="/contact/">Contact</a>',
            '<a href="/sitemap.xml">Sitemap</a>',
        ]
    )


def tool_card(tool: dict) -> str:
    return f"""
    <article class=\"tool-card\" data-category=\"{escape(tool['category'])}\" data-search=\"{escape(tool['title'].lower() + ' ' + tool['summary'].lower())}\">
      <div class=\"tool-card-top\">
        <span class=\"tool-icon\">{escape(tool['icon'])}</span>
        <span class=\"pill\">{escape(tool['category'].title())}</span>
      </div>
      <h3><a href=\"/tools/{escape(tool['slug'])}/\">{escape(tool['title'])}</a></h3>
      <p>{escape(tool['summary'])}</p>
      <a class=\"tool-link\" href=\"/tools/{escape(tool['slug'])}/\">Open tool <span aria-hidden=\"true\">→</span></a>
    </article>
    """


def tool_grid(tools: list[dict]) -> str:
    return '<div class="tool-grid">' + "\n".join(tool_card(tool) for tool in tools) + "</div>"


def faq_html(items: list[tuple[str, str]]) -> str:
    return "\n".join(
        f"<details class=\"faq-item\"><summary>{escape(q)}</summary><p>{escape(a)}</p></details>"
        for q, a in items
    )


def related_tools_html(tool: dict) -> str:
    related = [TOOL_MAP[r] for r in tool.get("related", []) if r in TOOL_MAP]
    if not related:
        return ""
    cards = "\n".join(tool_card(item) for item in related)
    return f"""
    <section class=\"section\">
      <div class=\"container\">
        <div class=\"section-heading\">
          <h2>Related tools</h2>
          <p>Keep visitors exploring nearby utility pages and strengthen internal linking for SEO.</p>
        </div>
        <div class=\"tool-grid related-grid\">{cards}</div>
      </div>
    </section>
    """


def render_layout(*, title: str, description: str, path: str, body: str, extra_head: str = "") -> str:
    canonical = page_url(path)
    year = datetime.now().year
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{escape(title)}</title>
  <meta name=\"description\" content=\"{escape(description)}\" />
  <link rel=\"canonical\" href=\"{escape(canonical)}\" />
  <meta property=\"og:title\" content=\"{escape(title)}\" />
  <meta property=\"og:description\" content=\"{escape(description)}\" />
  <meta property=\"og:type\" content=\"website\" />
  <meta property=\"og:url\" content=\"{escape(canonical)}\" />
  <meta name=\"theme-color\" content=\"{escape(RUNTIME['brand_color'])}\" />
  <link rel=\"icon\" href=\"/assets/favicon.svg\" type=\"image/svg+xml\" />
  <link rel=\"stylesheet\" href=\"/assets/styles.css\" />
  <script defer src=\"/assets/site-config.js\"></script>
  <script defer src=\"/assets/app.js\"></script>
  {extra_head}
</head>
<body>
  <div class=\"site-shell\">
    <header class=\"site-header\">
      <div class=\"container header-inner\">
        <a class=\"brand\" href=\"/\"><span class=\"brand-mark\">✦</span><span>{escape(RUNTIME['site_name'])}</span></a>
        <nav class=\"nav\">{nav_links()}</nav>
      </div>
    </header>
    <main>
      {body}
    </main>
    <footer class=\"site-footer\">
      <div class=\"container footer-grid\">
        <div>
          <h3>{escape(RUNTIME['site_name'])}</h3>
          <p>{escape(SITE['description'])}</p>
          <p class=\"muted\">© {year} {escape(RUNTIME['site_name'])}. Built for fast browser-side tools.</p>
        </div>
        <div>
          <h4>Useful pages</h4>
          <div class=\"footer-links\">{footer_links()}</div>
        </div>
        <div>
          <h4>Privacy-first setup</h4>
          <ul class=\"footer-list\">
            <li>Most tools run locally in the browser</li>
            <li>No login wall or forced upload</li>
            <li>Cloudflare Pages friendly static output</li>
          </ul>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>
"""


def render_homepage() -> str:
    category_cards = []
    for category in SITE["categories"]:
        category_cards.append(
            f"""
            <a class=\"category-card\" href=\"/category/{escape(category['id'])}/\">
              <span class=\"pill\">Category</span>
              <h3>{escape(category['name'])}</h3>
              <p>{escape(category['description'])}</p>
              <span class=\"tool-link\">Explore <span aria-hidden=\"true\">→</span></span>
            </a>
            """
        )
    body = f"""
    <section class=\"hero\">
      <div class=\"container hero-grid\">
        <div>
          <span class=\"eyebrow\">Fast. Private. Search-friendly.</span>
          <h1>{escape(SITE['tagline'])}</h1>
          <p class=\"hero-copy\">{escape(SITE['description'])} This starter kit is designed for Cloudflare Pages and can be monetized later with AdSense once your content and policy pages are ready.</p>
          <div class=\"hero-actions\">
            <a class=\"btn btn-primary\" href=\"#all-tools\">Browse tools</a>
            <a class=\"btn btn-secondary\" href=\"/about/\">Read the setup notes</a>
          </div>
          <div class=\"stat-row\">
            <div class=\"stat\"><strong>{len(TOOLS)}</strong><span>starter tools</span></div>
            <div class=\"stat\"><strong>100%</strong><span>browser-side by default</span></div>
            <div class=\"stat\"><strong>SEO</strong><span>friendly static pages</span></div>
          </div>
        </div>
        <div class=\"hero-panel\">
          <div class=\"preview-card\">
            <div class=\"preview-top\"><span></span><span></span><span></span></div>
            <h3>Built for long-run efficiency</h3>
            <ul>
              <li>Static multipage layout for better indexing</li>
              <li>Friendly progress UI to improve user trust</li>
              <li>Clean internal linking for discoverability</li>
              <li>Optional Cloudflare Worker for health checks</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class=\"section\">
      <div class=\"container\">
        <div class=\"section-heading\">
          <h2>Pick a category</h2>
          <p>Start with a focused utility cluster and expand only after you see search demand.</p>
        </div>
        <div class=\"category-grid\">{''.join(category_cards)}</div>
      </div>
    </section>

    <section class=\"section\" id=\"all-tools\">
      <div class=\"container\">
        <div class=\"section-heading spread\">
          <div>
            <h2>All starter tools</h2>
            <p>Every tool below has its own static landing page so it can rank individually.</p>
          </div>
          <div class=\"search-wrap\">
            <input id=\"tool-search\" class=\"search-input\" type=\"search\" placeholder=\"Search tools like json, image, gst...\" aria-label=\"Search tools\" />
          </div>
        </div>
        {tool_grid(TOOLS)}
      </div>
    </section>

    <section class=\"section soft-section\">
      <div class=\"container info-grid\">
        <article class=\"info-card\">
          <h3>Why this architecture works</h3>
          <p>Cloudflare Pages is a good fit for utility sites because static pages are cheap, fast, and easy to cache. Browser-side tools reduce your backend cost and simplify privacy messaging.</p>
        </article>
        <article class=\"info-card\">
          <h3>How to grow it later</h3>
          <p>Add more tool pages around real search terms, write short helpful content per tool, and only introduce backend processing when a browser cannot do the job.</p>
        </article>
        <article class=\"info-card\">
          <h3>Monetize carefully</h3>
          <p>Focus first on quality pages, legal pages, and a good user experience. Then enable AdSense or a similar ad network once the site looks complete and policy-compliant.</p>
        </article>
      </div>
    </section>
    """
    write_page("/index.html", render_layout(title=f"{SITE['name']} - Browser Side Utility Tools", description=SITE['description'], path="/", body=body))


def render_category_pages() -> None:
    for category in SITE["categories"]:
        tools = [t for t in TOOLS if t["category"] == category["id"]]
        body = f"""
        <section class=\"page-hero\">
          <div class=\"container\">
            <span class=\"eyebrow\">Category</span>
            <h1>{escape(category['name'])}</h1>
            <p class=\"hero-copy\">{escape(category['description'])}</p>
          </div>
        </section>
        <section class=\"section\">
          <div class=\"container\">
            <div class=\"section-heading\">
              <h2>{escape(category['name'])} tools</h2>
              <p>These pages are generated statically for clean internal linking and faster loading.</p>
            </div>
            {tool_grid(tools)}
          </div>
        </section>
        """
        write_page(
            f"/category/{category['id']}/index.html",
            render_layout(
                title=f"{category['name']} - {SITE['name']}",
                description=category["description"],
                path=f"/category/{category['id']}/",
                body=body,
            ),
        )


def render_tool_page(tool: dict) -> None:
    tool_data = json.dumps({k: v for k, v in tool.items() if k not in {"faq", "how_to", "related"}}).replace("</", "<\\/")
    how_to_list = "".join(f"<li>{escape(step)}</li>" for step in tool["how_to"])
    faq_block = faq_html(tool["faq"])
    body = f"""
    <section class=\"page-hero small\">
      <div class=\"container\">
        <nav class=\"breadcrumbs\"><a href=\"/\">Home</a><span>›</span><a href=\"/category/{escape(tool['category'])}/\">{escape(tool['category'].title())}</a><span>›</span><span>{escape(tool['title'])}</span></nav>
        <span class=\"eyebrow\">{escape(tool['category'].title())} tool</span>
        <h1>{escape(tool['title'])}</h1>
        <p class=\"hero-copy\">{escape(tool['summary'])}</p>
      </div>
    </section>

    <section class=\"section tool-section\">
      <div class=\"container tool-layout\">
        <div class=\"tool-main\">
          <div class=\"tool-panel\">
            <div class=\"tool-panel-head\">
              <div>
                <h2>Use this tool</h2>
                <p class=\"muted\">Friendly progress states are included to reassure users while the browser is working.</p>
              </div>
              <span class=\"privacy-badge\">Local processing</span>
            </div>
            <div id=\"tool-root\" class=\"tool-root\"></div>
          </div>
          <div class=\"ad-card\" data-ad-slot=\"content-inline\">
            <div class=\"ad-placeholder\">Ad space reserved. Keep disabled until your site is approved.</div>
          </div>
        </div>
        <aside class=\"tool-sidebar\">
          <div class=\"side-card\">
            <h3>Why users like this</h3>
            <ul class=\"feature-list\">
              <li>No login or account required</li>
              <li>Fast browser-side processing</li>
              <li>Works well on mobile and desktop</li>
            </ul>
          </div>
          <div class=\"side-card\">
            <h3>How to use</h3>
            <ol class=\"steps-list\">{how_to_list}</ol>
          </div>
          <div class=\"side-card\">
            <h3>Helpful note</h3>
            <p class=\"muted\">Static pages plus light JavaScript are usually a better long-run starting point than expensive upload-heavy backends.</p>
          </div>
        </aside>
      </div>
    </section>

    <section class=\"section soft-section\">
      <div class=\"container faq-wrap\">
        <div class=\"section-heading\">
          <h2>Frequently asked questions</h2>
          <p>Answer common objections on each tool page to improve trust and usefulness.</p>
        </div>
        {faq_block}
      </div>
    </section>

    {related_tools_html(tool)}

    <script id=\"tool-data\" type=\"application/json\">{tool_data}</script>
    """
    write_page(
        f"/tools/{tool['slug']}/index.html",
        render_layout(
            title=tool["seo_title"],
            description=tool["meta_description"],
            path=f"/tools/{tool['slug']}/",
            body=body,
        ),
    )


def render_simple_pages() -> None:
    for page in PAGES:
        body = f"""
        <section class=\"page-hero small\">
          <div class=\"container\">
            <span class=\"eyebrow\">Info page</span>
            <h1>{escape(page['title'])}</h1>
            <p class=\"hero-copy\">{escape(page['content'])}</p>
          </div>
        </section>
        <section class=\"section\">
          <div class=\"container prose\">
            <p>{escape(page['content'])}</p>
            <p>Before going live, update this page with your real brand details, support email, and any extra disclosures needed for your region, analytics setup, or ad network.</p>
          </div>
        </section>
        """
        write_page(
            f"/{page['slug']}/index.html",
            render_layout(
                title=f"{page['title']} - {SITE['name']}",
                description=page["content"],
                path=f"/{page['slug']}/",
                body=body,
            ),
        )


def write_page(relative_path: str, html: str) -> None:
    path = PUBLIC / relative_path.lstrip("/")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")


def write_robots_and_sitemap() -> None:
    robots = f"User-agent: *\nAllow: /\nSitemap: {page_url('/sitemap.xml')}\n"
    (PUBLIC / "robots.txt").write_text(robots, encoding="utf-8")

    urls = [page_url("/")]
    urls.extend(page_url(f"/category/{category['id']}/") for category in SITE["categories"])
    urls.extend(page_url(f"/tools/{tool['slug']}/") for tool in TOOLS)
    urls.extend(page_url(f"/{page['slug']}/") for page in PAGES)
    now = datetime.now(timezone.utc).date().isoformat()
    items = "\n".join(
        f"<url><loc>{escape(url)}</loc><lastmod>{now}</lastmod></url>" for url in urls
    )
    sitemap = f"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{items}\n</urlset>\n"
    (PUBLIC / "sitemap.xml").write_text(sitemap, encoding="utf-8")


def write_headers() -> None:
    content = """
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
/assets/*
  Cache-Control: public, max-age=31536000, immutable
""".strip() + "\n"
    (PUBLIC / "_headers").write_text(content, encoding="utf-8")


def main() -> None:
    ensure_clean_dir(PUBLIC)
    copy_assets()
    write_site_config(RUNTIME)
    render_homepage()
    render_category_pages()
    for tool in TOOLS:
        render_tool_page(tool)
    render_simple_pages()
    write_robots_and_sitemap()
    write_headers()
    print(f"Built {len(TOOLS)} tools into {PUBLIC}")


RUNTIME = load_runtime_config()

if __name__ == "__main__":
    main()
