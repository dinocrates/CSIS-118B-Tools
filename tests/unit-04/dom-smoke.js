'use strict';

/*
 * dom-smoke.js — NOT part of the committed test suite (not wired
 * into run-all.js). A lightweight, ad hoc DOM shim used during
 * development to execute each Unit 4 tool's real app.js (and the
 * shared scripts it loads, in the same order as the page's own
 * <script> tags) inside Node, to catch null-reference / wiring bugs
 * without a real browser. This is not a substitute for manual
 * browser verification (see the handoff notes for what was and was
 * not checked in an actual browser).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeElement(tag) {
  const el = {
    tagName: (tag || 'DIV').toUpperCase(),
    children: [],
    _listeners: {},
    style: {},
    dataset: {},
    attributes: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    get firstChild() { return this.children[0] || null; },
    appendChild(child) { this.children.push(child); return child; },
    insertBefore(child, ref) { this.children.unshift(child); return child; },
    removeChild(child) { this.children = this.children.filter((c) => c !== child); },
    setAttribute(name, val) { this.attributes[name] = String(val); },
    getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; },
    addEventListener(evt, fn) {
      this._listeners[evt] = this._listeners[evt] || [];
      this._listeners[evt].push(fn);
    },
    dispatch(evt, evtObj) {
      (this._listeners[evt] || []).forEach((fn) => fn(evtObj || { target: this, preventDefault() {}, key: '' }));
    },
    closest() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  return el;
}

function runTool(toolDir, scripts, initialValues) {
  console.log('\n--- ' + toolDir + ' ---');
  const elementsById = new Map();
  function getOrCreate(id) {
    if (!elementsById.has(id)) {
      const el = makeElement('div');
      if (initialValues && initialValues[id] !== undefined) el.value = initialValues[id];
      elementsById.set(id, el);
    }
    return elementsById.get(id);
  }

  const body = makeElement('body');
  body.classList = { _set: new Set(), add(c) { this._set.add(c); }, remove(c) { this._set.delete(c); }, contains(c) { return this._set.has(c); } };

  const documentStub = {
    body: body,
    getElementById(id) { return getOrCreate(id); },
    createElement(tag) { return makeElement(tag); },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };

  const sandbox = {
    console,
    BigInt,
    Number,
    Math,
    Object,
    Array,
    JSON,
    String,
    URLSearchParams,
    setTimeout,
    navigator: {},
  };
  sandbox.window = sandbox;
  sandbox.document = documentStub;
  sandbox.window.location = { search: '' };
  const context = vm.createContext(sandbox);

  scripts.forEach((scriptPath) => {
    const code = fs.readFileSync(scriptPath, 'utf8');
    try {
      vm.runInContext(code, context, { filename: scriptPath });
    } catch (e) {
      console.log('ERROR loading ' + scriptPath + ': ' + e.stack);
      throw e;
    }
  });
  console.log('loaded OK, elements touched: ' + elementsById.size);

  return {
    click(id) {
      getOrCreate(id).dispatch('click', { target: getOrCreate(id), preventDefault() {} });
    },
    clickPreset(rowId, presetValue) {
      const fakeBtn = { dataset: { preset: presetValue }, closest: () => fakeBtn };
      getOrCreate(rowId).dispatch('click', { target: fakeBtn, preventDefault() {} });
    },
    setAndChange(id, value) {
      const el = getOrCreate(id);
      el.value = value;
      el.dispatch('change', { target: el, preventDefault() {} });
    },
    setAndInput(id, value) {
      const el = getOrCreate(id);
      el.value = value;
      el.dispatch('input', { target: el, preventDefault() {} });
    },
    setValueQuiet(id, value) {
      getOrCreate(id).value = value;
    }
  };
}

const ROOT = path.join(__dirname, '..', '..', 'unit-04');

try {
  const movement = runTool('movement', ['shared/width-ops.js', 'shared/movement-model.js', 'shared/ui-shell.js', 'movement/app.js'].map((p) => path.join(ROOT, p)));
  movement.click('step-btn'); movement.click('step-btn'); movement.click('step-btn');
  movement.setValueQuiet('scenario-select', 'copy-dword'); // simulate the browser auto-selecting the first <option>
  movement.click('reset-btn');
  movement.setAndChange('scenario-select', 'xchg-memory');
  movement.click('step-btn'); movement.click('step-btn'); movement.click('step-btn'); movement.click('step-btn');
  movement.setAndChange('form-select', '9');
  movement.click('reveal-form-btn');

  const af = runTool('arithmetic-flags', ['shared/width-ops.js', 'shared/integer-input.js', 'shared/arithmetic-model.js', 'shared/ui-shell.js', 'arithmetic-flags/app.js'].map((p) => path.join(ROOT, p)), {
    'width-select': '8', 'op-select': 'ADD', 'a-input': '127', 'b-input': '1', 'cf-select': '0'
  });
  for (let i = 0; i < 14; i++) af.clickPreset('preset-row', String(i));
  af.setAndChange('op-select', 'INC');
  af.click('reveal-btn');
  af.setAndChange('op-select', 'NEG');
  af.click('reveal-btn');
  af.click('reset-btn');
  af.setAndInput('a-input', '200');
  af.click('reveal-btn');

  const mul = runTool('multiplication', ['shared/width-ops.js', 'shared/integer-input.js', 'shared/multiplication-model.js', 'shared/ui-shell.js', 'multiplication/app.js'].map((p) => path.join(ROOT, p)), {
    'width-select': '8', 'form-select': 'one', 'mode-select': 'unsigned', 'a-input': '48', 'b-input': '4', 'imm-input': '10'
  });
  mul.setAndChange('mode-select', 'signed'); mul.click('reveal-btn');
  mul.setAndChange('width-select', '32');
  mul.setAndChange('form-select', 'two'); mul.click('reveal-btn');
  mul.setAndChange('form-select', 'three'); mul.click('reveal-btn');
  mul.setAndChange('width-select', '8');
  mul.setAndChange('form-select', 'two'); mul.click('reveal-btn'); // should hit the 8-bit rejection path, not throw
  mul.click('reset-btn');

  const div = runTool('division', ['shared/width-ops.js', 'shared/integer-input.js', 'shared/division-model.js', 'shared/ui-shell.js', 'division/app.js'].map((p) => path.join(ROOT, p)), {
    'width-select': '32', 'op-select': 'unsigned', 'prep-select': 'narrow', 'narrow-input': '25', 'high-input': '0', 'low-input': '25', 'divisor-input': '12'
  });
  for (let i = 0; i < 5; i++) div.clickPreset('preset-row', String(i));
  div.setAndChange('prep-select', 'manual'); div.click('reveal-btn');
  div.setAndChange('op-select', 'signed'); div.click('reveal-btn');
  div.click('reset-btn');

  const ext = runTool('extension', ['shared/width-ops.js', 'shared/integer-input.js', 'shared/extension-model.js', 'shared/ui-shell.js', 'extension/app.js'].map((p) => path.join(ROOT, p)), {
    'src-width-select': '8', 'src-value-input': '0xF0', 'dest-width-select': '32', 'mode-select': 'zero'
  });
  ['0x00', '0x7F', '0x80', '0xFF', '0xF0'].forEach((p) => ext.clickPreset('preset-row', p));
  ext.setAndChange('src-width-select', '16'); ext.click('reveal-btn');
  ext.setAndChange('mode-select', 'sign'); ext.click('reveal-btn');
  ext.click('reset-btn');

  const bo = runTool('byte-offsets', [
    path.join(ROOT, '..', 'unit-03', 'shared', 'integer-input.js'),
    path.join(ROOT, '..', 'unit-03', 'shared', 'storage-layout.js'),
    path.join(ROOT, 'shared', 'storage-access-model.js'),
    path.join(ROOT, 'shared', 'ui-shell.js'),
    path.join(ROOT, 'byte-offsets', 'app.js')
  ], {
    'width-select': '4', 'values-input': '100, 200, 300, 400', 'offset-input': '8', 'access-width-select': '4',
    'store-index-input': '3', 'store-value-input': '999'
  });
  bo.click('apply-btn');
  bo.click('read-btn');
  bo.click('store-btn');
  bo.setAndInput('offset-input', '14');
  bo.click('read-btn'); // out-of-bounds path, should not throw
  [0, 1, 2].forEach((i) => bo.clickPreset('preset-row', String(i)));
  bo.click('reset-btn');

  console.log('\nAll tools loaded and interacted with, without throwing.');
} catch (e) {
  console.log('FAILED:', e.stack);
  process.exit(1);
}
