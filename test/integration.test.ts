import assert from 'assert';
import path from 'path';
import coffee from 'coffee';


const fixtures = path.join(__dirname, 'fixtures');

describe('test/integation.test.ts', () => {
  it('should exit when loglevel is error', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02001.js'))
      .debug()
      .end();
    assert.strictEqual(code, 1);
    assert.match(stdout, /\[@cnpmcore\/errors\]E02001: 当前 Node 版本 v10.10.0，不符合最低 Node 版本 v14.20.0，要求/);
  });

  it('should print error message and fix successfully', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02002.js'))
      .debug()
      .end();
    assert.strictEqual(code, 0);
    assert.match(stdout, /\[@cnpmcore\/errors\]W02002: 当前 Node 版本 v14.20.0，不符合最低 Node 版本 v16.19.0，要求/);
    assert.match(stdout, /\[@cnpmcore\/errors\]W02002: 错误修复成功！/);

  });

  it('should print error message and fix error', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02003.js'))
      .debug()
      .end();
    assert.strictEqual(code, 0);
    assert.match(stdout, /\[@cnpmcore\/errors\]W02003: 当前 Node 版本 v14.20.0，不符合最低 Node 版本 v16.19.0，要求/);
    assert.match(stdout, /\[@cnpmcore\/errors\]W02003: 错误码修复失败，请手动或参照文档修复。https:\/\/alipay.com/)
  });

  it('should print nothing when loglevel is error and encounter a warning', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02004.js'))
      .debug()
      .end();
    assert.strictEqual(code, 0);
    assert.strictEqual(stdout, '');
  });

  it('should print en-us error', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02002-en-us.js'))
      .debug()
      .end();
    assert.strictEqual(code, 0);
    assert.match(stdout, /\[@cnpmcore\/errors\]W02002: Node version v14.20.0 does not satisfy the lowest Node v16.19.0/);
  });

  it('should run config.js', async () => {
    const { code, stdout } = await coffee.fork(path.join(fixtures, 'error-scripts', '02012.js'))
      .debug()
      .end();
    assert.strictEqual(code, 0);
    assert.match(stdout, /\[@cnpmcore\/errors\]I02012: 当前框架是 @cnpmcore\/errors@1.0.0/);
  });
});
