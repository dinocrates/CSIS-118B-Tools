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

## Unit 2 — CPU, Instructions, and Flags

A single tabbed lab page lives at [unit-02/index.html](unit-02/index.html), covering three linked explorations:

| Demo | What it teaches |
|------|------------------|
| Instruction-cycle explorer | Steps a fixed NASM snippet (`mov`/`mov`/`add`/`sub`) through fetch/decode/execute; EAX/EBX/flags only change on execute |
| Register-alias explorer | MOV through RAX/EAX/AX/AH/AL from a starting `0x1122334455667788`, showing which bytes are written, zero-extended, or preserved |
| Arithmetic-flags explorer | ADD/SUB at 8/16/32/64 bits with full CF/ZF/SF/OF/AF/PF, unsigned and signed interpretations |

Unlike Unit 1 (one folder per tool), Unit 2 is one page with three `role="tab"` panels, matching the originally supplied prototype design. It follows the same conventions otherwise:
- Math lives in dependency-free modules under [unit-02/shared/](unit-02/shared/) (`instruction-model.js`, `register-alias.js`, `arithmetic-flags.js`), loaded by `<script src>` and exercised by [tests/unit-02/](tests/unit-02/). `unit-02/app.js` only wires the DOM to those modules — it does no arithmetic of its own.
- `?embed=1` hides the course header for Canvas iframes, via `unit-02/shared/ui-shell.js` (same pattern as `unit-01/shared/ui-shell.js`).
- Deep links to a specific demo use a `#demo1` / `#demo2` / `#demo3` hash, combinable with `?embed=1` (e.g. `unit-02/index.html?embed=1#demo2`). [unit-02/canvas-embeds.html](unit-02/canvas-embeds.html) has the copy-paste snippets.
- All arithmetic uses BigInt; no fixed-width masking relies on JS `Number`.

Run its tests with `node tests\unit-02\run-all.js` (68 checks, including the ADD/SUB acceptance table at every required width and the register-alias independent/cumulative examples).

**Known limitation:** this page was built and integrated against the `unit02-interactive-lab.html` prototype only. The companion `unit02-lecture-preview.html`, `unit02-canvas.html`, and the four lecture-diagram assets described in the integration brief were not available in this repository or session, so the Canvas rich-content fragment, its image-field URLs, and the lesson/module/video link resolution described in that brief are **not done** — only the standalone lab page, its tests, and its Canvas iframe embed snippets (with placeholder token names, unverified against the actual lecture page) are included. The token-mapping section of `unit-02/canvas-embeds.html` says this explicitly.

## Unit 3 — Memory, Data Representation, and the Assembler

Five standalone tools live under [unit-03/](unit-03/), one folder each (Unit 1 style):

| Tool | Folder | What it teaches |
|------|--------|------------------|
| Load–compute–store tracer | [unit-03/memory-trace/](unit-03/memory-trace/) | Steps `lea` / `mov` (load) / `add` / `mov` (store) one instruction at a time; LEA only computes an address, ADD wraps mod 2^32, and ordinary MOV cannot copy memory-to-memory |
| Storage-layout explorer | [unit-03/storage-layout/](unit-03/storage-layout/) | `db`/`dw`/`dd`/`dq` byte layout and offsets for 1–8 initializers, little-endian within each element, with the accepted two's-complement range per width |
| Byte interpretation and extension | [unit-03/byte-interpretation/](unit-03/byte-interpretation/) | Unsigned/signed readings of one stored byte, plus MOVZX EDI / MOVSX RDI / MOVSX EDI widening into a 64-bit register (including the MOVSX-to-EDI zero-extension trap) |
| String bytes and length explorer | [unit-03/string-length/](unit-03/string-length/) | Visible characters vs. storage bytes vs. the assembly-time `$ - label` span, with safe NASM source generation for text containing quote characters |
| Assembler phase workbench | [unit-03/assembler-workbench/](unit-03/assembler-workbench/) | Five fixed NASM examples (EQU, `%define`, grouped `%define`, `%assign`, runtime ADD) compared at preprocessing, assembly, and runtime |

Each tool:
- Is a single folder with its own `index.html` + `app.js`, plus shared code in [unit-03/shared/](unit-03/shared/) (`styles.css`, `ui-shell.js`, and one pure-math module per concern: `integer-input.js`, `memory-model.js`, `storage-layout.js`, `byte-extension.js`, `string-layout.js`, `assembler-phases.js`).
- Works as a normal full page, **and** supports `?embed=1` for the Canvas iframe mode, same as Unit 1/2.
- Uses BigInt throughout for fixed-width integer math (32-bit wraparound, 64-bit sign extension, two's-complement byte patterns) — a string never passes through `Number` on its way to becoming a 64-bit integer. Decimal and `0x`/`0b`/`0o` literals are parsed explicitly (including a leading `-` on a non-decimal literal, which `BigInt()` itself rejects) by the shared `integer-input.js` module.
- Scopes its dark, shadow-free NASM/byte-table code theme under a `.u03-tool` wrapper class in `unit-03/shared/styles.css`, so it cannot leak into Unit 1/2 or the root homepage.

[unit-03/index.html](unit-03/index.html) links all five tools and the reused Unit 2 register-alias explorer (see below). [unit-03/canvas-embeds.html](unit-03/canvas-embeds.html) has the copy-paste iframe snippets and the verified lecture-placement table. The root [index.html](index.html) tile grid also lists all five tools for browsing/launching outside Canvas.

**Reused tool, not a sixth one:** the lecture's brief register-width review reuses the existing [Unit 2 register-alias explorer](unit-02/index.html?embed=1#demo2) (`unit-02/index.html?embed=1#demo2`) rather than a new Unit 3 tool. See `unit-03/canvas-embeds.html` for its embed snippet alongside the five new tools.

Run its tests with `node tests\unit-03\run-all.js` (154 checks, including an exhaustive sweep of all 256 byte patterns for the MOVZX/MOVSX extension tool, exact 64-bit boundary checks for the storage-layout tool, every register/memory state in the load–compute–store trace including the uint32 wraparound and zero-addend cases, and byte-for-byte agreement between generated NASM source and the byte table for the string tool, including its quote-character fallback).

**Known limitation:** this task's supplied package (`lesson-plan.md`, `interactive-tool-spec.md`, the three `canvas/lecture-NN.html` fragments, the `demos/u03-*.asm` files, `images/`, `scripts/`, `validation.md`, the Design Bible, and the Unit 3 review HTML) was **not present in this repository or session** — only the five standalone prototype HTML files were available as attachments. The five tools, their math modules, and their tests were built directly from this task's own written requirements (control ranges, acceptance tables, and required explanations) and from inspecting the five prototypes, not from the lecture fragments or demo `.asm` files. The `TOOL INSERT LOCATION:` comments described in the task were not found in any file in this repository, so `unit-03/canvas-embeds.html` documents the placement mapping from the task's own instructions but has not verified or edited actual Canvas lecture page content — that part is left to the instructor.

## Unit 4 — Data Movement and Arithmetic

Four standalone tools live under [unit-04/](unit-04/), one folder each (Unit 1/3 style), plus two small supplementary tools that extend two existing Unit 3 tools rather than duplicating them:

| Tool | Folder | What it teaches |
|------|--------|------------------|
| Movement instruction lab | [unit-04/movement/](unit-04/movement/) | Curated MOV/XCHG trace scenarios (DWORD memory copy, register exchange, a failed two-MOV "swap", memory exchange through a register, three independent partial-register writes AL/AX/EAX), plus a curated MOV-form legality bank (valid/invalid/ambiguous/storage-overreading) |
| Arithmetic and flags lab | [unit-04/arithmetic-flags/](unit-04/arithmetic-flags/) | ADD/SUB/INC/DEC/NEG at 8/16/32/64 bits with exact CF/OF/ZF/SF, distinguishing a freshly computed CF from one preserved by INC/DEC, with AF/PF as a secondary reference |
| Multiplication register-pair lab | [unit-04/multiplication/](unit-04/multiplication/) | One-operand full-product MUL/IMUL into AX / DX:AX / EDX:EAX / RDX:RAX, plus truncated two-/three-operand signed IMUL (not offered at 8-bit); exact 2w-bit products via BigInt |
| Division preparation lab | [unit-04/division/](unit-04/division/) | Narrow zero/sign-extension (CBW/CWD/CDQ/CQO) or manual high:low dividend preparation, exact DIV/IDIV, and divide-error detection (zero divisor or an out-of-range quotient, including signed-minimum ÷ −1) |

**Supplementary tools (verified reuse, not new homepage tiles):** Unit 3's existing [Byte interpretation and extension](unit-03/byte-interpretation/) and [Storage-layout explorer](unit-03/storage-layout/) tools are the primary reuse for two Unit 4 activities, but each has a real gap against this unit's requirements — inspected directly in their own `app.js`/model files, not assumed:
- `unit-03/byte-interpretation` is hard-locked to an 8-bit source and two fixed destinations (EDI/RDI); it has no general source-width/destination-width picker and no MOVSXD. [unit-04/extension/](unit-04/extension/) adds exactly that, built on a new `extension-model.js` (not a copy of `byte-extension.js`), and links back to the Unit 3 tool for its interactive bit-toggle UI.
- `unit-03/storage-layout` has no arbitrary byte-offset+width access independent of element boundaries, and no store simulation. [unit-04/byte-offsets/](unit-04/byte-offsets/) adds both, built directly on top of (via `require`/script tag, not a copy of) `unit-03/shared/storage-layout.js`.

Each tool:
- Is a single folder with its own `index.html` + `app.js`, plus shared code in [unit-04/shared/](unit-04/shared/) (`styles.css`, `ui-shell.js`, `integer-input.js`, `width-ops.js`, and one pure-math module per concern: `movement-model.js`, `arithmetic-model.js`, `multiplication-model.js`, `division-model.js`, `extension-model.js`, `storage-access-model.js`).
- Works as a normal full page, **and** supports `?embed=1` for the Canvas iframe mode, same as Units 1–3.
- Uses BigInt throughout, including exact 64-bit operands and 128-bit products — never `Number`/`parseInt`/floating point on the way to a fixed-width integer. An ordinary operand field accepts a signed decimal spelling or an unsigned bit pattern in the width's union range; a manual dividend half accepts only an unsigned bit pattern.
- Scopes its dark, shadow-free NASM/table code theme under a `.u04-tool` wrapper class in `unit-04/shared/styles.css`, so it cannot leak into Units 1–3 or the root homepage.

[unit-04/index.html](unit-04/index.html) links all four tools plus the two reuse/supplement pairs. [unit-04/canvas-embeds.html](unit-04/canvas-embeds.html) has the copy-paste iframe snippets and the verified 12-slot lecture-placement table. The root [index.html](index.html) tile grid lists the four new tools (not the two supplementary pages, which are reached from the Unit 4 index/embeds page instead, per this task's instructions).

Run its tests with `node tests\unit-04\run-all.js` (204 checks across eight shared modules). Oracles for the arithmetic/multiplication/division tables are hand-computed from the task's own worked examples, independent of the functions under test — not snapshots of the modules' own output — and include exact arithmetic above `Number.MAX_SAFE_INTEGER` (e.g. a 128-bit unsigned QWORD×QWORD product, and a 64-bit dividend built from a nonzero manual high half).

**Verification performed, and what was not:** `node tests\unit-04\run-all.js` passes (204/204), and the full existing `unit-01`/`unit-02`/`unit-03` suites were re-run and still pass unchanged. A non-browser environment check was also used during development: [tests/unit-04/dom-smoke.js](tests/unit-04/dom-smoke.js) (not wired into `run-all.js`, not a committed test) loads each tool's actual `app.js` and shared scripts into a minimal in-process DOM shim and exercises its buttons/selects/presets, to catch null-reference and wiring bugs without a real browser. **No actual browser was available in the session that built Unit 4**, so actual rendering, CSS layout at narrow widths/200% zoom, real keyboard/screen-reader navigation, and the Canvas iframe embed itself have **not** been exercised and need a human (or browser-automation) pass before relying on them — the same caveat Unit 3's README section already carries for itself.

**Note on `unit-04/byte-offsets`:** this page loads `unit-03/shared/integer-input.js` directly (not `unit-04/shared/integer-input.js`) because it also loads `unit-03/shared/storage-layout.js`, which expects that exact module on `window.CSIS118B.IntegerInput`. Its accepted literal syntax is Unit 3's own (also accepts `0o` octal, and allows a leading `-` on any base), not the slightly stricter Unit 4 lexical contract documented above for the other four tools.

## Adding a new tool

- **Unit 1 style (recommended for Unit 1 additions):** add a `unit-01/<tool-name>/` folder with its own `index.html` + `app.js`, reuse `unit-01/shared/styles.css` and `ui-shell.js`, add a link on `unit-01/index.html`, add a snippet to `unit-01/canvas-embeds.html`, and add a tile entry to the root `index.html`'s `TOOLS` array.
- **Unit 3 style (recommended for Unit 3 additions):** add a `unit-03/<tool-name>/` folder with its own `index.html` + `app.js`, wrap the page content in a `<main class="u03-tool">` so it picks up the dark code-block theme, reuse `unit-03/shared/styles.css` and `ui-shell.js`, add a pure-math module under `unit-03/shared/` if the tool needs one (tested under `tests/unit-03/`), add a link on `unit-03/index.html`, add a snippet to `unit-03/canvas-embeds.html`, and add a tile entry to the root `index.html`'s `TOOLS` array.
- **Unit 2 style (recommended for Unit 2 additions):** add a new tab/section to `unit-02/index.html`, its math to a new `unit-02/shared/*.js` module (loaded by `<script src>`, tested under `tests/unit-02/`), and its DOM wiring to `unit-02/app.js`. Add a snippet to `unit-02/canvas-embeds.html`.
- **Other / one-off tools:** drop a self-contained HTML file into `visualizers/` and add an entry to the `TOOLS` array near the top of the `<script>` in the root `index.html` (unit, title, file path, embed height, description, demo list). The tile, embed code, and tool count are generated from that entry automatically.

Unit 4 followed the Unit 1/3 one-folder-per-tool style exactly (see the Unit 4 section above), with its own `unit-04/shared/width-ops.js` added for the BigInt width/mask/sign-extend helpers every Unit 4 model needed in common.

## Running the tests

The math modules have a plain Node test suite (no dependencies, no build step):

```powershell
# from the repository root
node tests\unit-01\run-all.js
node tests\unit-02\run-all.js
node tests\unit-03\run-all.js
node tests\unit-04\run-all.js
```

Unit 1 runs 48 checks across its four shared modules, including an **exhaustive sweep of every 4-bit and 8-bit addition operand pair** (65,792 pairs total) checking the stored result, carry-out, signed overflow, and column-trace consistency against the closed-form formulas — not just the specific acceptance-case numbers. Unit 2 runs 68 checks across its three shared modules: the full instruction trace, the register-alias acceptance/boundary table (including the EAX zero-extension cases), and the ADD/SUB flag acceptance table at 8/16/32/64-bit boundaries. Unit 3 runs 154 checks across its six shared modules, each checked against an independently computed expectation rather than a snapshot of the module's own output — notably an exhaustive sweep of **all 256 byte patterns** for unsigned/signed readings and all three MOVZX/MOVSX extensions, exact boundary checks at every storage width (including the full unsigned 64-bit maximum and signed 64-bit minimum), the complete load–compute–store register/memory trace (including the uint32 wraparound and zero-addend acceptance cases), and byte-table/generated-source agreement for the string tool across its quote-character fallback paths.

There is no committed browser/DOM test harness (adding one would mean shipping a dev dependency the production site doesn't need). During development, the UI was additionally exercised with a temporary Playwright harness (not part of this repo) that:
- Loaded each tool's real DOM and clicked through presets, bit toggles, width/operand changes, invalid input, and the predict/reveal flow, asserting on the rendered output (Unit 1: 94 checks; Unit 2: 59 checks, including the full fetch/decode/execute trace, all four register-alias acceptance examples, the ADD/SUB flag table, stale-input warnings, and keyboard tab navigation — 0 failures, 0 console errors in both).
- Loaded each tool in an actual Chromium browser at 320px, 375px, 768px, and 1100px widths, asserting no horizontal page overflow.
- Loaded Unit 2 with `?embed=1`, confirming the course header is hidden and `#demo1`/`#demo2`/`#demo3` deep links open the right tab — the actual mechanism Canvas uses. Unit 1 additionally verified this across a different local origin (`127.0.0.1` inside a `localhost` host page).
- Confirmed zero console errors and zero failed asset requests, in both normal and `?embed=1` modes, for all tools.

**Not verified** (needs a human pass): an actual Canvas Student View embed, 200%-zoom reflow, and manual keyboard-only navigation/screen-reader narration end to end. The markup uses semantic buttons/labels, `aria-pressed`/`aria-selected` on real toggles, `aria-live` status regions, and visible focus outlines throughout, but automated DOM tests can drive elements programmatically without proving a screen reader announces them well — please spot-check with a keyboard and/or screen reader before relying on this for an accommodation.

**Unit 3 specifically:** no Playwright (or other real-browser) harness was run against the Unit 3 pages in the session that built them — only the `node tests\unit-03\run-all.js` math-module suite above, plus a plain HTTP check that every page/script/stylesheet under `unit-03/` returns 200 from a local static server. Clicking through presets/bit toggles/Apply/Reset/Step, the `?embed=1` course-header toggle, 320/375/768/1100px reflow, 200% zoom, and keyboard/screen-reader navigation have **not** been exercised in an actual browser for Unit 3 and still need a human (or browser-automation) pass before relying on them.

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

Opening `unit-01\byte-explorer\index.html` etc. directly as a `file://` URL (double-click, or `start .\unit-01\byte-explorer\index.html`) also works — the tools use plain `<script src>` tags, not ES modules, so they don't hit the `file://` CORS restrictions ES modules run into. A local server is only needed to test the iframe-embedding behavior itself. The same applies to `unit-03\<tool>\index.html` (e.g. `start .\unit-03\memory-trace\index.html`) and `unit-04\<tool>\index.html` (e.g. `start .\unit-04\movement\index.html`), or browse `http://localhost:8080/unit-03/` / `http://localhost:8080/unit-04/` once a local server is running.

## Canvas embedding

Open [unit-01/canvas-embeds.html](unit-01/canvas-embeds.html) (Unit 1), [unit-02/canvas-embeds.html](unit-02/canvas-embeds.html) (Unit 2), [unit-03/canvas-embeds.html](unit-03/canvas-embeds.html) (Unit 3), or [unit-04/canvas-embeds.html](unit-04/canvas-embeds.html) (Unit 4 — locally or on the live site) for:
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

**Unit 3 starting iframe heights** (from `unit-03/canvas-embeds.html`): Load–compute–store tracer 900px, Storage-layout explorer 900px, Byte interpretation and extension 950px, String bytes and length explorer 900px, Assembler phase workbench 720px. Unlike the Unit 1 heights above, these were **not** sanity-checked in an actual browser in the session that set them — they are reasoned estimates from each page's panel count and content (and, for storage-layout/string-length, from the fact that their byte tables scroll within a fixed-height region rather than growing the page), and should be re-measured against the real rendered page before trusting them in Canvas.

**Unit 4 starting iframe heights** (from `unit-04/canvas-embeds.html`): Movement instruction lab 1300px, Arithmetic and flags lab 1150px, Multiplication register-pair lab 1050px, Division preparation lab 1050px, Byte interpretation and extension (Unit 3 reuse) 950px, Zero/sign extension supplement 1250px, Storage-layout explorer (Unit 3 reuse) 900px, Byte-offsets supplement 1150px. Like the Unit 3 heights, these are reasoned estimates from each page's panel count, **not** measured against an actual rendered browser (none was available in the session that built Unit 4) — re-measure against the real page before trusting them in Canvas.

## Deployment

GitHub Actions deploys the whole repository (this includes `unit-01/`, `unit-02/`, `unit-03/`, and `unit-04/`) to GitHub Pages on every push to `main` — see [.github/workflows/pages.yml](.github/workflows/pages.yml). No changes were needed to the existing workflow for Unit 4; it already publishes the full repo root, and the workflow's only required-file check (`index.html` at the repo root) is unaffected by these additions.

In the GitHub repository, **Settings → Pages → Build and deployment** should have **Source** set to **GitHub Actions**.
