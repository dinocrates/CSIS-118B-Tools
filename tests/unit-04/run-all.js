'use strict';

const suites = [
  require('./integer-input.test.js'),
  require('./width-ops.test.js'),
  require('./movement-model.test.js'),
  require('./arithmetic-model.test.js'),
  require('./multiplication-model.test.js'),
  require('./division-model.test.js'),
  require('./extension-model.test.js'),
  require('./storage-access-model.test.js')
];

let totalPass = 0;
let totalFail = 0;

suites.forEach((suite) => {
  totalPass += suite.pass;
  totalFail += suite.fail;
});

console.log('\n' + totalPass + ' passed, ' + totalFail + ' failed across ' + suites.length + ' suites.');
process.exit(totalFail > 0 ? 1 : 0);
