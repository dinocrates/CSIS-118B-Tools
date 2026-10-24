# Unit 6 decision tracer

Serve decision-tracer/index.html through a static HTTP server. Add ?embed=1 for embedding; provide an iframe title and separate-tab fallback. Suggested height: 2600px.

Four fixed examples illustrate even/odd choices, a grade-letter ladder, inside-range AND, and outside-range OR. This teaching simulation is not an assembler or general emulator. Numeric operands use BigInt and signed 64-bit bounds; character comparisons use printable ASCII. Validation is the tool's contract, not a simulation of malformed read_int input.

Choose a structure and input, predict the message, then step or reveal. Short-circuited comparisons are SKIPPED, never labeled false. Editing input clears the prediction/result. Reset keeps the input. Flags reuse the tested Unit 5 model; operands stay unchanged. Helper calls are outside the simulated decision.

## Tests

From repository root, with Node and no dependencies:

- node tests/unit-06/run-all.js
- node tests/unit-05/run-all.js
- node --check unit-06/decision-tracer/app.js

Unit 6 covers signed bounds, values beyond Number precision, all printable ASCII, branch order, skipped comparisons, equality and invalid input. Unit 5 exhaustively checks byte CMP/TEST flags and wider boundaries.

Manual browser QA covers predictions, step/reveal/reset, range boundaries, negative values, first-match/default paths, invalid input, keyboard focus order and 320px reflow. The trace table scrolls in a labeled keyboard-focusable region. Results use text plus color; status is a polite atomic live region. Actual screen-reader testing has not been performed.
