import path from 'path';
import assert from 'assert';
import { ErrorRunner, ErrorEnum } from '../src';
import { TESTER, CONFIG } from '../src/constants';


const fixtures = path.join(__dirname, 'fixtures');

describe.only('test/index.test.ts', () => {
  it('should print error message and fix successfully', async () => {
    const error = new ErrorRunner({
      path: path.join(fixtures, 'error-config'),
      lang: 'zh-cn',
      loglevel: ErrorEnum.Warning,
    });
    await error.loadErrorData();
    await error.test("Node version '{0}' does not satisfy the lowest Node '{1}'");
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
      await assert.rejects(errorRunner.precheck(''), {
        name: 'AssertionError',
        message: '错误码不存在：',
      });
    });

    it('should throw error when no code configured', async () => {
      await assert.rejects(errorRunner.precheck('Error Hint 000'), {
        name: 'AssertionError',
        message: '未配置错误：Error Hint 000',
      });
    });

    it('should throw error when no tester file configured', async () => {
      await assert.rejects(errorRunner.precheck('Error Hint No.5'), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', '02005', TESTER)} 文件不存在`,
      });
    });

    it('should throw error when no config file configured', async () => {
      await assert.rejects(errorRunner.precheck('Error Hint No.6'), {
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

      await assert.rejects(errorRunner.loadErrorData(), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', 'lang-not-exists.json')} 文件不存在`,
      });
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
      const errHint = "Error Hint No.7 '{0}', '{1}'";
      await errorRunner.precheck(errHint);
      await assert.rejects(errorRunner.generate(errHint), {
        name: 'AssertionError',
        message: "错误码所需参数不匹配！需要 2 个（错误提示 No.7, '{0}', '{1}'），实际 1 个（[\"v16.19.0\"]）",
      });
    });

    it('should success', async () => {
      const errHint = 'Error Hint No.1';
      await errorRunner.precheck(errHint);
      const message = await errorRunner.generate(errHint);
      assert.strictEqual(message, '[@cnpmjs/errors]E02001: 错误提示 No.1');
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
      await errorRunner.precheck(errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
    it('should print warning', async () => {
      const code = '02009';
      const errHint = 'Error Hint No.9';
      await errorRunner.precheck(errHint)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer successfully', async () => {
      const code = '02010';
      const errHint = 'Error Hint No.10';
      await errorRunner.precheck('Error Hint No.10')
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer failed', async () => {
      const code = '02011';
      const errHint = 'Error Hint No.11';
      await errorRunner.precheck('Error Hint No.11')
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(errHint);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
  });
});
