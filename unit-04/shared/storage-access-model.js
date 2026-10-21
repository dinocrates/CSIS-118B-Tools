/*
 * storage-access-model.js — adds two capabilities the existing
 * Unit 3 storage-layout explorer does not have: (1) an arbitrary
 * byte-offset + access-width read, independent of element
 * boundaries, with out-of-bounds detection; and (2) a store
 * simulation that replaces one element's value and re-renders the
 * byte layout. Built directly ON TOP OF (requires/reuses, does not
 * duplicate) unit-03/shared/storage-layout.js for initializer
 * parsing, two's-complement encoding, and little-endian layout. No
 * DOM; loaded as a plain script (window.CSIS118B.StorageAccessModel)
 * and via require() in Node for tests.
 */
(function (root, factory) {
  var StorageLayout = (typeof module !== 'undefined' && module.exports)
    ? require('../../unit-03/shared/storage-layout.js')
    : (root && root.CSIS118B ? root.CSIS118B.StorageLayout : null);

  var api = factory(StorageLayout);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.StorageAccessModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (StorageLayout) {
  'use strict';

  /** Flatten a computed layout's rows into a plain array of per-byte BigInt values in increasing-offset order. */
  function flattenBytes(values, widthBytes) {
    var layout = StorageLayout.computeLayout(values, widthBytes);
    var flat = new Array(layout.totalBytes);
    layout.rows.forEach(function (row) {
      flat[row.offset] = row.byte;
    });
    return { flat: flat, totalBytes: layout.totalBytes, layout: layout };
  }

  /**
   * Read accessWidthBytes bytes starting at byteOffset (little-
   * endian) out of the flattened storage, independent of element
   * boundaries. Returns { error } if the access would run past the
   * end of the declared storage (this tool does not claim the CPU
   * checks this automatically — it flags it as a teaching aid).
   */
  function accessAt(values, widthBytes, byteOffset, accessWidthBytes) {
    var built = flattenBytes(values, widthBytes);
    if (byteOffset < 0 || accessWidthBytes <= 0) {
      return { error: 'Byte offset and access width must be positive.' };
    }
    if (byteOffset + accessWidthBytes > built.totalBytes) {
      return {
        error: 'Out of bounds: a ' + accessWidthBytes + '-byte access at offset ' + byteOffset +
          ' would read through byte ' + (byteOffset + accessWidthBytes - 1) +
          ', but only ' + built.totalBytes + ' bytes (offsets 0 through ' + (built.totalBytes - 1) + ') are declared.'
      };
    }

    var value = 0n;
    for (var i = accessWidthBytes - 1; i >= 0; i--) {
      value = (value << 8n) | built.flat[byteOffset + i];
    }

    var elementSize = widthBytes;
    var startsAtElementBoundary = (byteOffset % elementSize) === 0;
    var owningElementIndex = Math.floor(byteOffset / elementSize);
    var endElementIndex = Math.floor((byteOffset + accessWidthBytes - 1) / elementSize);
    var spansMultipleElements = owningElementIndex !== endElementIndex || accessWidthBytes !== elementSize;

    return {
      error: null,
      byteOffset: byteOffset,
      accessWidthBytes: accessWidthBytes,
      value: value,
      startsAtElementBoundary: startsAtElementBoundary,
      owningElementIndex: owningElementIndex,
      spansMultipleElements: spansMultipleElements
    };
  }

  /**
   * Store simulation: replace one existing element's value (must
   * already be a valid index) with a new value that fits the
   * declared width, returning a NEW values array. Does not mutate
   * the input.
   */
  function storeElement(values, widthBytes, elementIndex, newValue) {
    if (!Number.isInteger(elementIndex) || elementIndex < 0 || elementIndex >= values.length) {
      return { error: 'Choose an existing zero-based element index from 0 through ' + (values.length - 1) + '.' };
    }
    var range = StorageLayout.rangeForWidth(widthBytes);
    if (newValue < range.min || newValue > range.max) {
      return {
        error: 'The stored value ' + newValue.toString() + ' does not fit a ' + (widthBytes * 8) +
          '-bit value. Accepted range is ' + range.min.toString() + ' through ' + range.max.toString() + '.'
      };
    }
    var next = values.slice();
    next[elementIndex] = newValue;
    return { error: null, values: next };
  }

  return {
    flattenBytes: flattenBytes,
    accessAt: accessAt,
    storeElement: storeElement
  };
});
