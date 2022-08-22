import path from 'path';
import assert from 'assert';
import { ErrorRunner, ErrorEnum } from '../src';
import { TESTER, CONFIG } from '../src/constants';
import {
  Error1,
  Error2,
  Error5,
  Error6,
  Error7,
} from './fixtures/error-config/error';


const fixtures = path.join(__dirname, 'fixtures');

describe('test/index.test.ts', () => {
  it('should print error message and fix successfully', async () => {
    const error = new ErrorRunner({
      path: path.join(fixtures, 'error-config'),
      lang: 'zh-cn',
      loglevel: ErrorEnum.Warning,
    });
    await error.loadErrorData();
    await error.test(new Error2());
  });

  describe('prefix', () => {
    let errorRunner: ErrorRunner;
    beforeEach(async () => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Error,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });
      await errorRunner.loadErrorData();
    });

    it('should throw error when no code present', async () => {
      await assert.rejects(errorRunner.precheck('', ''), {
        name: 'AssertionError',
        message: '错误码不存在：, ',
      });
    });

    it('should throw error when no tester file configured', async () => {
      const { code, message } = new Error5();
      await assert.rejects(errorRunner.precheck(code, message), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', '02005', TESTER)} 文件不存在`,
      });
    });

    it('should throw error when no config file configured', async () => {
      const { code, message } = new Error6();
      await assert.rejects(errorRunner.precheck(code, message), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', '02006', CONFIG)} 文件不存在`,
      });
    });

    it('should throw error when no lang configured', async () => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Error,
        path: path.join(fixtures, 'error-config'),
        lang: 'lang-not-exists',
      });

      await assert.doesNotReject(errorRunner.loadErrorData());
    });
  });

  describe('generate', () => {
    let errorRunner: ErrorRunner;
    beforeEach(async () => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Error,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });
      await errorRunner.loadErrorData();
    });

    it('should throw error when placeholder not match', async () => {
      const { code, message } = new Error7();
      await errorRunner.precheck(code, message);
      await assert.rejects(errorRunner.generate(code, message), {
        name: 'AssertionError',
        message: "错误码所需参数不匹配！需要 2 个（错误提示 No.7, '{0}', '{1}'），实际 1 个（[\"v16.19.0\"]）",
      });
    });

    it('should success', async () => {
      const { code, message } = new Error1();
      await errorRunner.precheck(code, message);
      const errHint = await errorRunner.generate(code, message);
      assert.strictEqual(errHint, '[@cnpmjs/errors]E02001: 当前运行 Node 版本为 v14.20.0');
    });
  });

  describe('fixOrNot', () => {
    let errorRunner: ErrorRunner;
    beforeEach(async () => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Warning,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });
      await errorRunner.loadErrorData();
    });

    it('should do nothing', async () => {
      const code = '02008';
      const errHint = 'Error Hint No.8'
      await errorRunner.precheck(code, errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code, errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
    it('should print warning', async () => {
      const code = '02009';
      const errHint = 'Error Hint No.9';
      await errorRunner.precheck(code, errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code, errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer successfully', async () => {
      const code = '02010';
      const errHint = 'Error Hint No.10';
      await errorRunner.precheck(code, errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code, errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer failed', async () => {
      const code = '02011';
      const errHint = 'Error Hint No.11';
      await errorRunner.precheck(code, errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code, errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
  });
});
