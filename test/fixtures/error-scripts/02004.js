'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { Error4 } = require('../error-config/error');
const { ErrorRunner, ErrorEnum } = require('../../../lib');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
  loglevel: ErrorEnum.Error,
});

(async () => {
  await error.loadErrorData();
  await error.test(new Error());
})();
