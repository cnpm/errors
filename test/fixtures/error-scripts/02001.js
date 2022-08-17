'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { ErrorRunner } = require('../../..');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
});

(async () => {
  await error.test('02001');
})();
