'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { ErrorRunner, ErrorEnum } = require('../../../lib');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
  loglevel: ErrorEnum.Warning,
});

(async () => {
  await error.loadErrorData();
  await error.test("Node version '{0}' does not satisfy the lowest Node '{1}'");
})();
