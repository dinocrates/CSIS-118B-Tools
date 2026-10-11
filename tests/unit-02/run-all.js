'use strict';

const suites = [
  require('./instruction-model.test.js'),
  require('./register-alias.test.js'),
  require('./arithmetic-flags.test.js')
];

let totalPass = 0;
let totalFail = 0;

suites.forEach((suite) => {
  totalPass += suite.pass;
  totalFail += suite.fail;
});

console.log('\n' + totalPass + ' passed, ' + totalFail + ' failed across ' + suites.length + ' suites.');
process.exit(totalFail > 0 ? 1 : 0);
