'use strict';

const path = require('path');
const fixtures = path.join(__dirname, '..');
const { ErrorRunner, ErrorEnum } = require('../../../lib');

const error = new ErrorRunner({
  path: path.join(fixtures, 'error-config'),
  lang: 'zh-cn',
  loglevel: ErrorEnum.Info,
});

(async () => {
  await error.loadErrorData();
  await error.test('Error Hint No.12');
})();
