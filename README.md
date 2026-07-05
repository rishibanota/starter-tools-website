# ToolMint starter

A static multi-page tools website designed for:
- Cloudflare Pages
- mostly browser-side processing
- low-cost / no-cost start
- future AdSense monetization
- easy SEO indexing with one page per tool

## What is in this starter
- Python build script for generating static pages
- modern responsive UI
- 17 browser-side starter tools
- category pages, sitemap, robots, headers
- optional Cloudflare Pages Function (`/api/health`)
- AdSense-ready config placeholders

## Important practical note
For a true client-side tools site, **the browser runtime must be JavaScript**.
Python is used here as the **static site generator / build layer**.
That is the best practical mix for:
- SEO
- Cloudflare Pages
- privacy-first local processing
- free-tier longevity

## Quick start

```bash
cd tools-site
cp site_config.example.json site_config.json
python3 build.py
```

Your deployable site will be generated into:

```bash
tools-site/public
```

## Open locally
You can open `public/index.html` directly, but some browsers are happier with a tiny local server:

```bash
cd tools-site/public
python3 -m http.server 8080
```

Then open:
- `http://localhost:8080/`

## Deploy to Cloudflare Pages
Fastest no-code route:
1. Build locally: `python3 build.py`
2. In Cloudflare Pages, deploy the `public` directory using **Direct Upload**
3. Later connect GitHub if you want a smoother workflow

## GitHub-first deployment without building on your device
This project also includes:

```text
.github/workflows/deploy-cloudflare-pages.yml
```

That workflow can:
- build the site on GitHub Actions
- deploy it to Cloudflare Pages automatically
- avoid needing your laptop for future builds

See `procedure.md` for the exact GitHub secrets, variables, and setup steps.

## Tools included
- JSON Formatter
- JSON to CSV
- CSV to JSON
- Base64 Encoder
- Base64 Decoder
- URL Encoder
- URL Decoder
- Text Case Converter
- Slug Generator
- SHA-256 Generator
- JWT Decoder
- Unix Timestamp Converter
- Image to Base64
- Image Resizer & Converter
- GST Calculator
- EMI Calculator
- Percentage Calculator

## How to add a new tool
1. Add a new entry to `content.py`
2. Add a matching case in `src/assets/app.js`
3. Run `python3 build.py` again

## Where to change branding
- `site_config.json`
- `content.py`
- `src/assets/favicon.svg`
- `src/assets/styles.css`

## AdSense note
Do **not** enable AdSense immediately on a thin site.
First make sure you have:
- completed legal pages
- enough useful content
- a real contact email
- a consistent brand
- policy-compliant pages

Then set in `site_config.json`:
```json
{
  "adsense_client": "ca-pub-XXXXXXXXXXXXXXXX",
  "enable_auto_ads": true
}
```

Rebuild:
```bash
python3 build.py
```

## Optional Cloudflare API usage
This starter does not require API keys for version 1.
You only need a Cloudflare API token later if you want:
- CI/CD deploys with Wrangler
- automated deployments from GitHub Actions
- scripted updates through the Cloudflare API

See `procedure.md` for the exact steps.
