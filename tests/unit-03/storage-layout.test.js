'use strict';

const StorageLayout = require('../../unit-03/shared/storage-layout.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// Independent range formulas: [-2^(w-1), 2^w - 1].
let r = StorageLayout.rangeForWidth(1);
check('db range', r.min === -128n && r.max === 255n);
r = StorageLayout.rangeForWidth(2);
check('dw range', r.min === -32768n && r.max === 65535n);
r = StorageLayout.rangeForWidth(4);
check('dd range', r.min === -2147483648n && r.max === 4294967295n);
r = StorageLayout.rangeForWidth(8);
check('dq range', r.min === -9223372036854775808n && r.max === 18446744073709551615n);

// dd 10, 20, 30, 40 -> 16 bytes; starts 0,4,8,12; index 3 = 40 at offset 12.
let parsed = StorageLayout.parseInitializers('10, 20, 30, 40', 4);
check('parses 4 dd initializers', parsed.error === null && parsed.values.length === 4);
let layout = StorageLayout.computeLayout(parsed.values, 4);
check('dd total bytes', layout.totalBytes === 16);
check('dd offsets', layout.elements.map((e) => e.offset).join(',') === '0,4,8,12');
check('dd index 3 value', layout.elements[3].value === 40n && layout.elements[3].offset === 12);
check('dd rows length', layout.rows.length === 16);
check('offset 0x0B (11) does not start an element', !layout.elements.some((e) => e.offset === 11));
const row11 = layout.rows.find((row) => row.offset === 11);
check('offset 11 is within an element, not a start', row11 && row11.isElementStart === false);

// dw 10, 20, 30, 40 -> 8 bytes; starts 0,2,4,6.
parsed = StorageLayout.parseInitializers('10, 20, 30, 40', 2);
layout = StorageLayout.computeLayout(parsed.values, 2);
check('dw total bytes', layout.totalBytes === 8);
check('dw offsets', layout.elements.map((e) => e.offset).join(',') === '0,2,4,6');

// dd 0x12345678 -> little-endian bytes 78,56,34,12 at offsets 0-3.
parsed = StorageLayout.parseInitializers('0x12345678', 4);
layout = StorageLayout.computeLayout(parsed.values, 4);
check('dd 0x12345678 byte order', layout.rows.map((row) => row.byte.toString(16).toUpperCase().padStart(2, '0')).join(',') === '78,56,34,12');

// dq max unsigned -> eight FF bytes, no rounding.
parsed = StorageLayout.parseInitializers('18446744073709551615', 8);
check('dq accepts unsigned max', parsed.error === null);
layout = StorageLayout.computeLayout(parsed.values, 8);
check('dq max unsigned -> all FF bytes', layout.rows.every((row) => row.byte === 0xFFn));

// dq most negative -> low 7 bytes 00, byte 7 = 80.
parsed = StorageLayout.parseInitializers('-9223372036854775808', 8);
check('dq accepts signed min', parsed.error === null);
layout = StorageLayout.computeLayout(parsed.values, 8);
check('dq min: bytes 0-6 are 00', layout.rows.slice(0, 7).every((row) => row.byte === 0n));
check('dq min: byte 7 is 0x80', layout.rows[7].byte === 0x80n);

// db -128 -> 0x80.
parsed = StorageLayout.parseInitializers('-128', 1);
check('db accepts -128', parsed.error === null);
layout = StorageLayout.computeLayout(parsed.values, 1);
check('db -128 pattern', layout.rows[0].byte === 0x80n);

// Reject out-of-range and malformed initializers.
check('db rejects -129', StorageLayout.parseInitializers('-129', 1).error !== null);
check('db rejects 256', StorageLayout.parseInitializers('256', 1).error !== null);
check('rejects empty list item', StorageLayout.parseInitializers('10, ,20', 4).error !== null);
check('rejects fraction', StorageLayout.parseInitializers('10.5', 4).error !== null);
check('rejects trailing junk', StorageLayout.parseInitializers('10abc', 4).error !== null);
check('rejects more than 8 initializers', StorageLayout.parseInitializers('1,2,3,4,5,6,7,8,9', 4).error !== null);
check('rejects fully empty input', StorageLayout.parseInitializers('', 4).error !== null);

// Element index validation.
check('valid index 3 of 4', StorageLayout.parseElementIndex('3', 4).index === 3);
check('rejects index 4 of 4', StorageLayout.parseElementIndex('4', 4).error !== null);
check('rejects negative index', StorageLayout.parseElementIndex('-1', 4).error !== null);
check('rejects fractional index', StorageLayout.parseElementIndex('1.5', 4).error !== null);

module.exports = suite;
