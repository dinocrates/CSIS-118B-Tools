# CSIS 118B Tools

Interactive, step-by-step tools for CSIS 118B (Computer Organization and Assembly). Each tool is a single self-contained HTML file — no build step, no dependencies.

**Live site:** https://dinocrates.github.io/CSIS-118B-Tools/

## Tools

| Unit | Tool | File |
|------|------|------|
| _(none yet)_ | | |

The landing page ([index.html](index.html)) shows a tile for each tool with a description, the list of included demos, a launch link, and copy-able iframe embed code for Canvas or any web page.

## Adding a new tool

1. Drop the self-contained HTML file into `visualizers/`.
2. Add an entry to the `TOOLS` array near the top of the `<script>` in `index.html` (unit, title, file path, description, demo list). The tile, embed code, and tool count are generated from that entry automatically.

## Deployment

GitHub Actions deploys the site to GitHub Pages on every push to `main`.

In the GitHub repository, go to **Settings > Pages > Build and deployment** and set **Source** to **GitHub Actions**.
