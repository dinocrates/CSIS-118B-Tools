'use strict';
/* Runs every unit-01 math test file and exits non-zero on any failure. */
var suites = [
  require('./bit-utils.test.js'),
  require('./addition-utils.test.js'),
  require('./bitwise-utils.test.js'),
  require('./fraction-utils.test.js')
];

var totalPass = 0, totalFail = 0;
suites.forEach(function (s) {
  totalPass += s.pass;
  totalFail += s.fail;
});

console.log('\n' + totalPass + ' passed, ' + totalFail + ' failed across ' + suites.length + ' suites.');
process.exit(totalFail > 0 ? 1 : 0);
