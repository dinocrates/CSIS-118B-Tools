# CSIS 118B Tools

Interactive, step-by-step tools for CSIS 118B (Computer Organization and Assembly). Each tool is a single static page — no server, no login, no build step, no third-party service — meant to be embedded in Canvas lecture pages with an iframe.

**Live site:** https://dinocrates.github.io/CSIS-118B-Tools/

## Unit 1 — Bits, Hex, and Fixed-Width Arithmetic

Four standalone tools live under [unit-01/](unit-01/):

| Tool | Folder | What it teaches |
|------|--------|------------------|
| Byte Explorer | [unit-01/byte-explorer/](unit-01/byte-explorer/) | Binary/hex/unsigned/signed (two's-complement) readings of one 8-bit pattern; step-by-step negate |
| Binary Addition with Carries | [unit-01/binary-addition/](unit-01/binary-addition/) | Column-by-column addition with carries at 4- or 8-bit width; carry-out vs. signed overflow |
| Bitwise Workbench | [unit-01/bitwise-workbench/](unit-01/bitwise-workbench/) | AND / OR / XOR / NOT on 8-bit values, with a live truth table and per-bit explanations |
| Binary Fraction Builder | [unit-01/binary-fractions/](unit-01/binary-fractions/) | Exact (BigInt) decimal-to-binary fraction conversion by repeated doubling; termination vs. repeating expansions |

Each tool:
- Is a single folder with its own `index.html` + `app.js`, plus shared code in [unit-01/shared/](unit-01/shared/) (`styles.css`, and one pure-math module per tool: `bit-utils.js`, `addition-utils.js`, `bitwise-utils.js`, `fraction-utils.js`, plus the DOM-only `ui-shell.js`).
- Works as a normal full page, **and** supports `?embed=1` in the URL, which hides the course header/nav and keeps only the tool itself — this is the mode used inside the Canvas iframe.
- Has no server, login, analytics, or external CDN dependency. Fonts are system fonts (Segoe UI / Arial / Consolas); all graphics are live HTML/CSS, not images.

The [Unit 1 index page](unit-01/index.html) links all four. [unit-01/canvas-embeds.html](unit-01/canvas-embeds.html) has the copy-paste iframe snippets (see **Canvas embedding** below). The root [index.html](index.html) tile grid also lists all four tools for browsing/launching outside Canvas.

### Math/DOM split

Every tool's arithmetic lives in a dependency-free module under `unit-01/shared/*.js`, written so the exact same file works as a browser `<script>` (attaches to `window.CSIS118B.*`) and as a Node `require()` target (for the test suite). The DOM/event-wiring code in each tool's `app.js` only calls into that module — it does no arithmetic of its own. This is what made it possible to exhaustively test the addition logic (see below) independent of any UI.

## Adding a new tool

- **Unit 1 style (recommended for Unit 1 additions):** add a `unit-01/<tool-name>/` folder with its own `index.html` + `app.js`, reuse `unit-01/shared/styles.css` and `ui-shell.js`, add a link on `unit-01/index.html`, add a snippet to `unit-01/canvas-embeds.html`, and add a tile entry to the root `index.html`'s `TOOLS` array.
- **Other / one-off tools:** drop a self-contained HTML file into `visualizers/` and add an entry to the `TOOLS` array near the top of the `<script>` in the root `index.html` (unit, title, file path, embed height, description, demo list). The tile, embed code, and tool count are generated from that entry automatically.

## Running the tests

The math modules have a plain Node test suite (no dependencies, no build step):

```powershell
# from the repository root
node tests\unit-01\run-all.js
```

This runs 48 checks across the four shared modules, including an **exhaustive sweep of every 4-bit and 8-bit addition operand pair** (65,792 pairs total) checking the stored result, carry-out, signed overflow, and column-trace consistency against the closed-form formulas — not just the specific acceptance-case numbers.

There is no committed browser/DOM test harness (adding one would mean shipping a dev dependency the production site doesn't need). During development, the UI was additionally exercised with a temporary jsdom + Playwright harness (not part of this repo) that:
- Loaded each tool's real DOM and clicked through presets, bit toggles, width/operand changes, invalid input, and the predict/reveal flow, asserting on the rendered output (94 checks, 0 failures, 0 console errors).
- Loaded each tool in an actual Chromium browser at 320px, 375px, 768px, and 1100px widths, and at a 200%-zoom-equivalent viewport, asserting no horizontal page overflow (49 checks, 0 failures).
- Embedded Byte Explorer in a page served from a different local origin (`127.0.0.1` inside a `localhost` host page) with `?embed=1`, confirming the tool renders, is interactive, and shows no course header inside the frame — the actual mechanism Canvas uses, not just a same-origin approximation.
- Confirmed zero console errors and zero failed asset requests, in both normal and `?embed=1` modes, for all four tools.

**Not verified** (needs a human pass): an actual Canvas Student View embed, and manual keyboard-only navigation/screen-reader narration end to end. The markup uses semantic buttons/labels, `aria-pressed` on real toggles, `aria-live` status regions, and visible focus outlines throughout, but automated DOM tests can drive elements programmatically without proving a screen reader announces them well — please spot-check with a keyboard and/or screen reader before relying on this for an accommodation.

## Previewing locally (Windows / PowerShell)

These are static files — no build step — so any static file server works. From the repository root:

```powershell
# Python (usually already available)
python -m http.server 8080
# then browse http://localhost:8080/unit-01/

# -- or --

# Node, if you have it
npx serve -l 8080
```

Opening `unit-01\byte-explorer\index.html` etc. directly as a `file://` URL (double-click, or `start .\unit-01\byte-explorer\index.html`) also works — the tools use plain `<script src>` tags, not ES modules, so they don't hit the `file://` CORS restrictions ES modules run into. A local server is only needed to test the iframe-embedding behavior itself.

## Canvas embedding

Open [unit-01/canvas-embeds.html](unit-01/canvas-embeds.html) (locally or on the live site) for:
- A ready-to-copy `<iframe>` snippet per tool (descriptive `title`, `loading="lazy"`, `width="100%"`, a measured starting `height`, `src` ending in `?embed=1`).
- A separate-tab fallback link (`target="_blank" rel="noopener"`) under each snippet, for Canvas setups that strip iframes.
- A live preview of each iframe on the page itself, so you can sanity-check before pasting into Canvas.
- The token → URL mapping for the lecture page's placeholders.

Current resolved URLs (base confirmed live on GitHub Pages at the time this was written — if the repo is ever moved to a different owner/name/custom domain, regenerate `canvas-embeds.html` rather than hand-editing the host in each snippet):

```
{{BYTE_EXPLORER_URL}}     = https://dinocrates.github.io/CSIS-118B-Tools/unit-01/byte-explorer/
{{BINARY_ADDITION_URL}}   = https://dinocrates.github.io/CSIS-118B-Tools/unit-01/binary-addition/
{{BITWISE_WORKBENCH_URL}} = https://dinocrates.github.io/CSIS-118B-Tools/unit-01/bitwise-workbench/
{{BINARY_FRACTIONS_URL}}  = https://dinocrates.github.io/CSIS-118B-Tools/unit-01/binary-fractions/
```

Iframe `src` = that URL + `?embed=1`. Fallback link = that URL with no query string.

**Starting iframe heights** (from `canvas-embeds.html`, tune after viewing the actual embedded result in Canvas — content height can shift slightly with Canvas's own fonts/zoom):

| Tool | Height |
|------|--------|
| Byte Explorer | 760px |
| Binary Addition with Carries | 860px |
| Bitwise Workbench | 900px |
| Binary Fraction Builder | 980px |

These starting values come from the spec and were sanity-checked by loading each tool at 1100px width in an actual browser and confirming no vertical content is clipped relative to them — but they weren't measured inside an actual Canvas iframe (Canvas's own CSS/zoom can shift things slightly), so treat them as a good starting point to fine-tune, not an exact final answer.

## Deployment

GitHub Actions deploys the whole repository (this includes `unit-01/`) to GitHub Pages on every push to `main` — see [.github/workflows/pages.yml](.github/workflows/pages.yml). No changes were needed to the existing workflow for Unit 1; it already publishes the full repo root.

In the GitHub repository, **Settings → Pages → Build and deployment** should have **Source** set to **GitHub Actions**.
