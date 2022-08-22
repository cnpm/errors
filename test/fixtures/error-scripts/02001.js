'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { Error1 } = require('../error-config/error');
const { ErrorRunner } = require('../../..');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
});


(async () => {
  await error.loadErrorData();
  await error.test(new Error1());
})();
