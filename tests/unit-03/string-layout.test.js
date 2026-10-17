'use strict';

const StringLayout = require('../../unit-03/shared/string-layout.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('accepts printable ASCII', StringLayout.validateText('Hi') === null);
check('accepts empty text', StringLayout.validateText('') === null);
check('accepts exactly 40 chars', StringLayout.validateText('a'.repeat(40)) === null);
check('rejects 41 chars', StringLayout.validateText('a'.repeat(41)) !== null);
check('rejects control character (code 10 inline)', StringLayout.validateText('a\nb') !== null);
check('rejects DEL (code 127)', StringLayout.validateText('a' + String.fromCharCode(127)) !== null);
check('rejects non-ASCII (code > 126)', StringLayout.validateText('café') !== null);

// Hi + LF + NUL acceptance case.
let rows = StringLayout.byteRows('Hi', true, true);
check('Hi+LF+NUL row count', rows.length === 4);
check('Hi byte 0 is H=0x48', rows[0].decimal === 72 && rows[0].hex === '0x48');
check('Hi byte 1 is i=0x69', rows[1].decimal === 105 && rows[1].hex === '0x69');
check('Hi byte 2 is LF=0x0A', rows[2].decimal === 10 && rows[2].hex === '0x0A');
check('Hi byte 3 is NUL=0x00', rows[3].decimal === 0 && rows[3].hex === '0x00');
check('Hi+LF+NUL storage/MESSAGE_BYTES is 4', StringLayout.storageByteCount('Hi', true, true) === 4);

check('Hi+NUL storage is 3', StringLayout.storageByteCount('Hi', false, true) === 3);
check('Hi+NUL visible is 2', 'Hi'.length === 2);
check('empty+NUL storage is 1', StringLayout.storageByteCount('', false, true) === 1);
check('empty, no extra bytes, storage is 0', StringLayout.storageByteCount('', false, false) === 0);

check('"A" byte is 0x41', StringLayout.byteRows('A', false, false)[0].hex === '0x41');

// Text "5" is the character code 53, not the integer 5.
check('character "5" is code 53, not 5', StringLayout.byteRows('5', false, false)[0].decimal === 53);

// Source generation: label-only when there are no bytes at all.
check('empty + no bytes is label-only source', StringLayout.buildSource('', false, false).indexOf('; Label only') !== -1);
check('non-empty text is not label-only', StringLayout.buildSource('A', false, false).indexOf('; Label only') === -1);

// Quote handling.
check('no quotes -> double-quoted', StringLayout.quoteStrategy('plain text') === 'double');
check('has double quote only -> single-quoted', StringLayout.quoteStrategy('He said "hi"') === 'single');
check('has single quote only -> double-quoted', StringLayout.quoteStrategy("it's") === 'double');
check('has both quotes -> numeric bytes', StringLayout.quoteStrategy('He said "it\'s"') === 'numeric');

let src = StringLayout.buildSource('He said "hi"', false, false);
check('single-quote fallback source uses single quotes', src.indexOf("'He said \"hi\"'") !== -1);
src = StringLayout.buildSource("it's", false, false);
check('double-quote fallback source uses double quotes', src.indexOf('"it\'s"') !== -1);
src = StringLayout.buildSource('He said "it\'s"', false, false);
check('both-quotes source falls back to numeric bytes (no unescaped quote inside a quoted literal)', src.indexOf('"') === -1 && src.indexOf("'") === -1);

// Bytes and generated source must agree exactly, including for the numeric-byte fallback.
const bothQuotesText = 'He said "it\'s" ok';
rows = StringLayout.byteRows(bothQuotesText, false, false);
src = StringLayout.buildSource(bothQuotesText, false, false);
const expectedTokens = rows.map((r) => String(r.decimal)).join(', ');
check('numeric-byte source matches byte table exactly', src.indexOf(expectedTokens) !== -1);

module.exports = suite;
