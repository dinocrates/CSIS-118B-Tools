/*
 * ui-shell.js — small DOM helpers shared by every Unit 3 tool page:
 * embed-mode detection (?embed=1), the course header injected in
 * normal mode, and a live-region announcer. Mirrors
 * unit-01/shared/ui-shell.js and unit-02/shared/ui-shell.js, with
 * its own Unit-3-labeled header (each unit keeps its own copy
 * rather than sharing one, matching the existing unit-01/unit-02
 * split). Not unit-tested (it is DOM glue, not math); the math
 * modules it sits on top of are tested under tests/unit-03/.
 */
(function (global) {
  'use strict';

  function isEmbedMode() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('embed') === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * Call once per page. In normal (non-embed) mode, inserts a small
   * course label + "back to Unit 3 tools" link above the tool. In
   * embed mode, adds the embed-mode body class so CSS hides it.
   */
  function initShell() {
    var embed = isEmbedMode();
    if (embed) {
      document.body.classList.add('embed-mode');
    }

    if (!embed) {
      var header = document.createElement('div');
      header.className = 'course-header';
      header.innerHTML =
        '<span>CSIS 118B &middot; Computer Organization &amp; Assembly &middot; Unit 3</span>' +
        '<a href="../index.html">&larr; All Unit 3 tools</a>' +
        '<a href="../../index.html">All CSIS 118B tools</a>';
      document.body.insertBefore(header, document.body.firstChild);
    }

    return { embed: embed };
  }

  /**
   * Update a live region's text so assistive tech announces it,
   * even if the new text is identical to the old text.
   */
  function announce(el, text) {
    if (!el) return;
    el.textContent = '';
    window.setTimeout(function () {
      el.textContent = text;
    }, 10);
  }

  global.CSIS118B = global.CSIS118B || {};
  global.CSIS118B.UiShell = {
    isEmbedMode: isEmbedMode,
    initShell: initShell,
    announce: announce
  };
})(window);
