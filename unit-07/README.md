# Unit 7 counted loop tracer

Serve loop-tracer/index.html through a static HTTP server. Add ?embed=1 for an iframe, with an accessible title and separate-tab fallback. Suggested height: 2600px. No dependencies or installation are required.

The fixed simulation follows guarded countdown, count-up and accumulator patterns with counts 0 through 10. BigInt makes integer state exact. It groups NASM instructions into phases and does not run arbitrary code or model every register/helper. The optional JGE exit is explicitly a what-if; the lesson uses JG. At most 44 phases are displayed. Counters never underflow; the largest sum is 55.

Predict body executions (and final sum for the accumulator), then Step, Run, Pause or Reveal. Run advances one phase every 800ms. Pause retains state; Reset retains the selected example but clears predictions/history. Editing an input or changing a prediction stops automatic stepping. History is bounded and keyboard-scrollable; live status and textual path labels supplement color. No autoplay starts on page load.

## Tests

From repository root: node tests/unit-07/run-all.js

The pure local suite checks every count in each supported pattern/bound variant, per-phase counter and sum invariants, body/update correspondence, zero-entry guards, exact output, termination and invalid inputs. Syntax check: node --check unit-07/loop-tracer/app.js

Manual browser checks cover prediction gating, stepping, run/pause/reset, zero/one/maximum cases, JG/JGE, invalid input, keyboard focus and narrow layout. Actual screen-reader testing has not been performed. Console output comparisons against separately recorded NASM runtime results are documented privately; no runtime assets or instructor materials are bundled here.
