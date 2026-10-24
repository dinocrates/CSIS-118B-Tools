# Unit 8 loop-control explorer

Serve loop-control/index.html through a static HTTP server. No installation or dependencies. Add ?embed=1 for embedding, with an accessible iframe title and separate-tab fallback. Suggested height: 2600px.

Two modes keep the scope focused. Condition timing follows two different lesson tasks: a pretest sentinel sum (five-value cap) and a posttest guess-until-correct loop (three accepted attempts). Decimal digits uses the unsigned DWORD domain 0 through 4294967295, with the required pretest and an explicitly labeled posttest comparison. Zero needs zero extractions in the pretest and one in the posttest. Both sums are zero. This does not change the lab requirement.

All arithmetic uses BigInt. The model groups phases; it is not a general emulator and does not run arbitrary code. Decimal input validation is explicit. Timing input lists contain at most five signed64 integers; out-of-domain lesson values follow their validation paths. Exhausted input lists show WAITING, never an invented input or normal termination. Unused supplied inputs are counted. No private instructor code, runtime assets or student data are bundled.

## Validation

Run node tests/unit-08/run-all.js and node --check unit-08/loop-control/app.js from repository root. The pure local suite covers digit division identities, decreasing quotients, accumulators, zero/trailing-zero/max-domain values, condition inversion, sentinel exclusion, success-before-cap, validation and waiting states. Expected sums are independently calculated from decimal characters. Timing combinations are enumerated against an independent output oracle.

Manual browser checks cover prediction gating, step/reveal/reset, quotient/remainder updates, invalid negative digit input, all stop reasons, zero pre/post differences, maximum input, keyboard focus, live status and 320px layout. Actual screen-reader testing has not been performed. Comparison with previously recorded NASM runtime output is kept in private QA evidence; this is not a claim of new browser playground execution.
