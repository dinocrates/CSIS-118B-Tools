# Unit 10 array index/address explorer

Serve array-address/index.html through a static HTTP server. No dependencies or installation. Add ?embed=1 for embedding with an accessible iframe title and separate-tab fallback; suggested height2800px.

The model supports 1/2/4/8-byte elements, one to eight stored values, an active prefix (possibly empty), an illustrative unsigned64 base and a signed64 requested index. Values may range from signed minimum through unsigned maximum for their width. BigInt handles offsets, addresses, bit patterns and sign interpretation exactly. Entire allocated storage must fit unsigned64 arithmetic; wrapped ranges are rejected.

No actual memory access, code execution or processor canonical-address validation occurs. Invalid indices produce no selected address or load. The layout remains a view of the supplied allocation. Signed and unsigned loads do not mutate data. Generated NASM fragments use a separate RIP-relative LEA for the base, then a scaled register index. They are explanatory fragments, not complete programs.

Choose accept/reject and optionally predict the selected signed or unsigned decimal value. Reveal shows byte layout and load alternatives; Reset clears the prediction/result and keeps inputs. Editing inputs hides previous results. Text states accompany selection colors. The layout is a labeled keyboard-focusable scrolling region and status is polite/atomic live text.

## Tests

Run node tests/unit-10/run-all.js and node --check unit-10/array-address/app.js from repository root. Tests exhaust all BYTE and WORD patterns for endian reconstruction and signed interpretation, check all widths and active bounds, negative and full64 values, zero length, address limits and invalid inputs. Selected loads are also compared privately with previously recorded NASM runtime output; no instructor files or runtime assets are published.

Browser QA covers presets, bounds/optional value predictions, unsigned interpretation, negative/one-past rejection, overflow validation, input-change clearing, reset, keyboard traversal and320px reflow. Actual screen-reader testing has not been performed.
