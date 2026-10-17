'use strict';

const suites = [
  require('./integer-input.test.js'),
  require('./memory-model.test.js'),
  require('./storage-layout.test.js'),
  require('./byte-extension.test.js'),
  require('./string-layout.test.js'),
  require('./assembler-phases.test.js')
];

let totalPass = 0;
let totalFail = 0;

suites.forEach((suite) => {
  totalPass += suite.pass;
  totalFail += suite.fail;
});

console.log('\n' + totalPass + ' passed, ' + totalFail + ' failed across ' + suites.length + ' suites.');
process.exit(totalFail > 0 ? 1 : 0);
