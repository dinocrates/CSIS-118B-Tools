'use strict';

const StorageAccessModel = require('../../unit-04/shared/storage-access-model.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// words: dw 10, 20, 30, 40 -> mov ax, word [rel words + 4] reads the third WORD, 30.
(function () {
  var words = [10n, 20n, 30n, 40n];
  var r = StorageAccessModel.accessAt(words, 2, 4, 2);
  check('words + 4 (WORD access): value is 30', r.error === null && r.value === 30n);
  check('words + 4: starts at an element boundary, is element index 2', r.startsAtElementBoundary === true && r.owningElementIndex === 2);
})();

// values: dd 100, 200, 300, 400 -> mov ecx, dword [rel values + 8] reads the third DWORD, 300.
(function () {
  var values = [100n, 200n, 300n, 400n];
  var r = StorageAccessModel.accessAt(values, 4, 8, 4);
  check('values + 8 (DWORD access): value is 300', r.error === null && r.value === 300n);
  check('values + 8: element index 2', r.owningElementIndex === 2);
})();

// Offset 2 into a DWORD array begins inside the first element, not the third element (offset is not an index).
(function () {
  var values = [100n, 200n, 300n, 400n];
  var r = StorageAccessModel.accessAt(values, 4, 2, 4);
  check('values + 2 (misaligned DWORD access) does not start at an element boundary', r.error === null && r.startsAtElementBoundary === false);
  check('values + 2 is still inside element index 0, not element index 2', r.owningElementIndex === 0);
})();

// mov dword [rel values + 12], 999 -> after the store, elements are 100,200,300,999.
(function () {
  var values = [100n, 200n, 300n, 400n];
  var stored = StorageAccessModel.storeElement(values, 4, 3, 999n);
  check('store at index 3: no error', stored.error === null);
  check('store at index 3: final elements 100,200,300,999', JSON.stringify(stored.values.map(String)) === JSON.stringify(['100', '200', '300', '999']));
  check('store at index 3: original array is untouched (no mutation)', values[3] === 400n);
  var layout12 = StorageAccessModel.accessAt(stored.values, 4, 12, 4);
  check('offset 12 after the store reads back 999', layout12.value === 999n);
})();

// Out-of-bounds access must be flagged, not silently truncated or wrapped.
(function () {
  var values = [100n, 200n, 300n, 400n];
  var r = StorageAccessModel.accessAt(values, 4, 14, 4); // only 16 bytes declared (0-15); 14..17 overruns
  check('an access past the end of declared storage is an error', r.error !== null);
})();

// Little-endian: DWORD 0x12345678 occupies increasing-address bytes 78, 56, 34, 12.
(function () {
  var built = StorageAccessModel.flattenBytes([0x12345678n], 4);
  check('little-endian byte order for 0x12345678', built.flat[0] === 0x78n && built.flat[1] === 0x56n && built.flat[2] === 0x34n && built.flat[3] === 0x12n);
})();

// Store rejects a value that does not fit the declared width.
(function () {
  var values = [10n, 20n];
  var stored = StorageAccessModel.storeElement(values, 1, 0, 300n); // byte range is -128..255
  check('storing an out-of-range value for the width is rejected', stored.error !== null);
})();

// Store rejects an out-of-range index.
(function () {
  var values = [10n, 20n];
  var stored = StorageAccessModel.storeElement(values, 1, 5, 1n);
  check('storing at a nonexistent index is rejected', stored.error !== null);
})();

// Exact QWORD values above Number precision survive the round trip.
(function () {
  var values = [18446744073709551615n]; // 2^64 - 1
  var r = StorageAccessModel.accessAt(values, 8, 0, 8);
  check('QWORD max value round-trips exactly', r.value === 18446744073709551615n);
})();

module.exports = suite;
