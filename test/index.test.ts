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
    await error.test('02002');
  });

  describe('prefix', () => {
    let errorRunner: ErrorRunner;
    beforeEach(() => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Error,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });
    });

    it('should throw error when no code present', async () => {
      await assert.rejects(errorRunner.precheck(''), {
        name: 'AssertionError',
        message: '错误码不存在：',
      });
    });

    it('should throw error when no code configured', async () => {
      await assert.rejects(errorRunner.precheck('111'), {
        name: 'AssertionError',
        message: '未配置错误码：111',
      });
    });

    it('should throw error when no tester file configured', async () => {
      await assert.rejects(errorRunner.precheck('02005'), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', '02005', TESTER)} 文件不存在`,
      });
    });

    it('should throw error when no config file configured', async () => {
      await assert.rejects(errorRunner.precheck('02006'), {
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

      await assert.rejects(errorRunner.precheck("11"), {
        name: 'Error',
        message: `${path.join(fixtures, 'error-config', 'lang-not-exists.json')} 文件不存在`,
      });
    });
  });

  describe('generate', () => {
    let errorRunner: ErrorRunner;
    beforeEach(() => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Error,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });

    });

    it('should throw error when placeholder not match', async () => {
      const code = '02007';
      await errorRunner.precheck(code)
      await assert.rejects(errorRunner.generate(code), {
        name: 'AssertionError',
        message: "错误码所需参数不匹配！需要 2 个（当前 Node 版本 '{0}'，不符合最低 Node 版本 '{1}'，要求），实际 1 个（[\"v16.19.0\"]）",
      });
    });

    it('should success', async () => {
      const code = '02001';
      await errorRunner.precheck(code)
      const message = await errorRunner.generate(code);
      assert.strictEqual(message, '[@cnpmcore/errors]E02001: 当前 Node 版本 v10.10.0，不符合最低 Node 版本 v14.20.0，要求');
    });
  });

  describe('fixOrNot', () => {
    let errorRunner: ErrorRunner;
    beforeEach(() => {
      errorRunner = new ErrorRunner({
        loglevel: ErrorEnum.Warning,
        path: path.join(fixtures, 'error-config'),
        lang: 'zh-cn',
      });
    });

    it('should do nothing', async () => {
      const code = '02008';
      await errorRunner.precheck(code)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
    it('should print warning', async () => {
      const code = '02009';
      await errorRunner.precheck(code)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer successfully', async () => {
      const code = '02010';
      await errorRunner.precheck(code)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });

    it('should run fixer failed', async () => {
      const code = '02011';
      await errorRunner.precheck(code)
      const valid = await errorRunner.runTest(code);
      const message = await errorRunner.generate(code);
      await assert.doesNotReject(errorRunner.fixOrNot(code, message, valid));
    });
  });
});
