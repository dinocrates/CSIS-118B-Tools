/*
 * string-layout.js — pure calculations for the string bytes and
 * length explorer (Unit 3, Tool 4): byte-by-byte breakdown of
 * printable ASCII text plus optional line-feed/NUL bytes, safe
 * NASM source generation (switching quote style or falling back to
 * numeric bytes when the text contains quote characters), and the
 * assembly-time $ - label span. No DOM; loaded as a plain script
 * (window.CSIS118B.StringLayout) and via require() in Node for
 * tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.StringLayout = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var MAX_LENGTH = 40;

  function isPrintableAscii(code) {
    return code >= 32 && code <= 126;
  }

  /** Validate 0-40 characters, all printable ASCII (codes 32-126). Returns an error string or null. */
  function validateText(text) {
    text = text === null || text === undefined ? '' : String(text);
    if (text.length > MAX_LENGTH) {
      return 'Text is ' + text.length + ' characters; the limit is ' + MAX_LENGTH + '.';
    }
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (!isPrintableAscii(code)) {
        return 'Character at position ' + i + ' (code ' + code + ') is not printable ASCII (32-126). ' +
          'This model accepts printable ASCII only, not Unicode/UTF-8 or control characters.';
      }
    }
    return null;
  }

  /** Byte-by-byte breakdown in address order: visible characters, then LF, then NUL. */
  function byteRows(text, includeLF, includeNUL) {
    var rows = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      rows.push({ offset: i, meaning: text[i], decimal: code, hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0') });
    }
    if (includeLF) {
      rows.push({ offset: rows.length, meaning: 'Line feed', decimal: 10, hex: '0x0A' });
    }
    if (includeNUL) {
      rows.push({ offset: rows.length, meaning: 'NUL terminator', decimal: 0, hex: '0x00' });
    }
    return rows;
  }

  /** 'double' | 'single' | 'numeric' — numeric only when the text contains BOTH quote characters. */
  function quoteStrategy(text) {
    var hasDouble = text.indexOf('"') !== -1;
    var hasSingle = text.indexOf("'") !== -1;
    if (!hasDouble) return 'double';
    if (!hasSingle) return 'single';
    return 'numeric';
  }

  /** Build the exact NASM source: the db line (or a label-only comment) plus the adjacent $ - label span. */
  function buildSource(text, includeLF, includeNUL) {
    var tokens = [];
    if (text.length > 0) {
      var strategy = quoteStrategy(text);
      if (strategy === 'double') {
        tokens.push('"' + text + '"');
      } else if (strategy === 'single') {
        tokens.push("'" + text + "'");
      } else {
        for (var i = 0; i < text.length; i++) {
          tokens.push(String(text.charCodeAt(i)));
        }
      }
    }
    if (includeLF) tokens.push('10');
    if (includeNUL) tokens.push('0');

    var dataLine = tokens.length > 0
      ? 'message: db ' + tokens.join(', ')
      : 'message: ; Label only: no bytes emitted';

    return dataLine + '\nMESSAGE_BYTES equ $ - message\n; Same section, immediately after the message.';
  }

  function storageByteCount(text, includeLF, includeNUL) {
    return text.length + (includeLF ? 1 : 0) + (includeNUL ? 1 : 0);
  }

  return {
    MAX_LENGTH: MAX_LENGTH,
    isPrintableAscii: isPrintableAscii,
    validateText: validateText,
    byteRows: byteRows,
    quoteStrategy: quoteStrategy,
    buildSource: buildSource,
    storageByteCount: storageByteCount
  };
});
