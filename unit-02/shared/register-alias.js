(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.RegisterAlias = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  function asBigInt(value) {
    if (typeof value === 'bigint') return value;
    if (value === null || value === undefined) return 0n;
    return BigInt(String(value).trim());
  }

  function formatHex(value, width) {
    var digits = Math.max(1, Math.ceil(width / 4));
    var text = value.toString(16).toUpperCase();
    return '0x' + text.padStart(digits, '0');
  }

  function parseUnsignedBigInt(raw, options) {
    options = options || {};
    var alias = options.alias || 'value';
    var width = Number(options.width || 64);
    var text = raw === null || raw === undefined ? '' : String(raw).trim();

    if (text.length === 0) {
      return { value: null, error: 'Enter a value for ' + alias + '.' };
    }
    if (text.startsWith('-')) {
      return { value: null, error: alias + ' is unsigned; negative values are rejected.' };
    }
    if (!/^(0[xX][0-9A-Fa-f]+|[0-9]+)$/.test(text)) {
      return { value: null, error: alias + ' must be a decimal integer or a 0x hexadecimal integer.' };
    }

    try {
      var value = BigInt(text);
      var max = (1n << BigInt(width)) - 1n;
      if (value > max) {
        return { value: null, error: alias + ' is out of range for ' + width + ' bits; max is ' + formatHex(max, width) + '.' };
      }
      return { value: value, error: null };
    } catch (e) {
      return { value: null, error: alias + ' is malformed; use decimal or 0x hexadecimal syntax.' };
    }
  }

  function applyAliasWrite(startRax, alias, value) {
    var rax = asBigInt(startRax) & 0xFFFFFFFFFFFFFFFFn;
    var source = asBigInt(value);
    var normalized = String(alias || 'RAX').toUpperCase();
    var result = rax;

    if (normalized === 'RAX') {
      result = source & 0xFFFFFFFFFFFFFFFFn;
    } else if (normalized === 'EAX') {
      // A 32-bit write zero-extends into the full 64-bit register (unlike AX/AH/AL).
      result = source & 0xFFFFFFFFn;
    } else if (normalized === 'AX') {
      result = (rax & ~0xFFFFn) | (source & 0xFFFFn);
    } else if (normalized === 'AH') {
      result = (rax & ~(0xFFn << 8n)) | ((source & 0xFFn) << 8n);
    } else if (normalized === 'AL') {
      result = (rax & ~0xFFn) | (source & 0xFFn);
    }

    return { rax: result, alias: normalized, value: source };
  }

  function getRaxByteGroups(startRax, alias) {
    var rax = asBigInt(startRax) & 0xFFFFFFFFFFFFFFFFn;
    var result = applyAliasWrite(rax, alias, alias === 'RAX' ? rax : 0n);
    var bytes = [];
    for (var i = 0; i < 8; i++) {
      var shift = BigInt(56 - i * 8);
      var byteMask = 0xFFn << shift;
      var value = (rax & byteMask) >> shift;
      var status = 'preserved';
      var name = 'byte ' + String(7 - i);

      if (String(alias).toUpperCase() === 'RAX') {
        status = 'written';
      } else if (String(alias).toUpperCase() === 'EAX') {
        status = i >= 4 ? 'written' : 'zeroed';
      } else if (String(alias).toUpperCase() === 'AX') {
        status = i >= 6 ? 'written' : 'preserved';
      } else if (String(alias).toUpperCase() === 'AH') {
        status = i === 6 ? 'written' : 'preserved';
      } else if (String(alias).toUpperCase() === 'AL') {
        status = i === 7 ? 'written' : 'preserved';
      }

      bytes.push({
        index: i,
        name: name,
        value: value,
        status: status
      });
    }

    return bytes;
  }

  return {
    parseUnsignedBigInt: parseUnsignedBigInt,
    applyAliasWrite: applyAliasWrite,
    getRaxByteGroups: getRaxByteGroups,
    formatHex: formatHex
  };
});
