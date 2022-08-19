'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { ErrorRunner } = require('../../..');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
});


(async () => {
  await error.loadErrorData();
  await error.test('Error Hint No.1');
})();
