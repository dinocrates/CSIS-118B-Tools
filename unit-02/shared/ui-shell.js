/*
 * ui-shell.js — small DOM helper shared by the Unit 2 lab page:
 * embed-mode detection (?embed=1) and the course header injected in
 * normal mode. Mirrors unit-01/shared/ui-shell.js. Not unit-tested
 * (it is DOM glue, not math); the math modules it sits on top of
 * are tested under tests/unit-02/.
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
   * course label + "back to all tools" link above the lab. In embed
   * mode, adds the embed-mode body class so CSS hides it.
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
        '<span>CSIS 118B &middot; Computer Organization &amp; Assembly &middot; Unit 2</span>' +
        '<a href="../index.html">&larr; All CSIS 118B tools</a>';
      document.body.insertBefore(header, document.body.firstChild);
    }

    return { embed: embed };
  }

  global.CSIS118B = global.CSIS118B || {};
  global.CSIS118B.UiShell = {
    isEmbedMode: isEmbedMode,
    initShell: initShell
  };
})(window);
