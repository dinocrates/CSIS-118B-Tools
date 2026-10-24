# Unit 5: CMP / TEST and branch decisions

Open `branch-decisions/index.html`. Add `?embed=1` to hide course navigation when embedding. Provide a descriptive iframe title and a separate-tab fallback. A starting iframe height of 2300px accommodates the revealed desktop layout; inspect the actual host and narrow/zoomed layouts before choosing the final height.

The explorer models two register operands and a following conditional jump, not a full emulator. It displays exact 8/16/32/64-bit interpretations, unchanged operands, temporary results, flags and executed/skipped label paths. Prediction, reveal, reset and six presets support practice. TEST's AF is explicitly undefined. JZ/JNZ aliases are explained; the controls use JE/JNE.

`shared/branch-model.js` is a pure model that reuses the unchanged Unit 4 integer parser and width helpers. `branch-decisions/app.js` handles the DOM. `shared/styles.css` isolates the Unit 5 presentation. Reuse the Unit 1 Bitwise Workbench for per-bit Boolean operations.

Run the dependency-free tests from the repository root:

```text
node tests/unit-05/run-all.js
```

The suite checks every 8-bit operand pair for CMP and TEST, 600 larger-width operation cases, conditional predicates and invalid inputs. It passes 1,446,615 assertions. This is mathematical verification, not hardware execution.

Browser checks cover presets, both branch paths, stale-result clearing, validation, keyboard activation, all 16 focus stops forward/backward, iframe mode and 320px layout. Labels, live-status text and focus styles were inspected. A 2x CSS magnification check passed reflow; native 200% browser zoom, screen-reader listening and final host embedding still need manual review. An intermittent browser MutationObserver error without a source URL could not be attributed; no tool dependency calls that API and no control failure was observed.

Semantics follow Intel SDM revision 093, Volume 2A CMP/Jcc and Volume 2B TEST: [Intel manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).
