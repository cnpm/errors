import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import cp from 'child_process';
import { format } from 'util';
// @ts-ignore
import awaitEvent from 'await-event';
import {
  ErrorRunnerOptions,
  ErrorOptions,
} from "./typings";
import {
  ErrorPrefix,
  ErrorEnum,
  LoglevelDigit,
  PLACEHOLDER,
  TESTER,
  FIXER,
  CONFIG,
} from "./constants";
import * as log from "./log";

// 错误码配置
class ErrorRunner {
  loglevel: ErrorEnum;
  path: string;
  lang: string;
  prefix: string;
  errorCodeData: Record<string, string>;

  constructor(options: ErrorRunnerOptions) {
    this.loglevel = options.loglevel || ErrorEnum.Error;
    this.path = options.path;
    this.lang = (options.lang || Intl.DateTimeFormat().resolvedOptions().locale).toLowerCase();
    this.prefix = options.prefix || '[@cnpmcore/errors]';
    this.errorCodeData = {};
  }

  async test(code: string) {
    await this.precheck(code);
    const valid = await this.runTest(code);
    const message = await this.generate(code);
    await this.fixOrNot(code, message, valid);
  }

  async precheck(code: string) {
    assert(code, `错误码不存在：${code}`);

    const errorCodePath = path.join(this.path, `${this.lang}.json`);
    try {
      await fs.stat(errorCodePath);
    } catch (error) {
      throw new Error(`${errorCodePath} 文件不存在`);
    }


    if (!Object.keys(this.errorCodeData).length) {
      const fileData = await fs.readFile(errorCodePath, 'utf8');
      this.errorCodeData = JSON.parse(fileData);
    }

    assert(this.errorCodeData[code], `未配置错误码：${code}`);

    const testerPath = path.join(this.path, code, TESTER);
    try {
      await fs.stat(testerPath);
    } catch (error) {
      throw new Error(`${testerPath} 文件不存在`);
    }

    const configPath = path.join(this.path, code, CONFIG);
    try {
      await fs.stat(configPath);
    } catch (error) {
      throw new Error(`${configPath} 文件不存在`);
    }
 }

  async runTest(code: string): Promise<boolean> {
    const testerPath = path.join(this.path, code, TESTER);
    const subprocess = cp.fork(testerPath);
    let exitCode = 1;
    try {
      exitCode = await awaitEvent(subprocess, 'exit');
    } catch (_) {
      // ignore error
    } finally {
      return exitCode === 0;
    }
  }

  async generate(code: string): Promise<string> {
    // 国际化
    let message = this.errorCodeData[code];
    const error = await this.getError(code);
    const loglevel = error.loglevel!;
    const placeholders = error?.placeholders || [];
    const placeholderLen = message.match(/'\{\d+\}'/g)?.length || 0;
    assert(placeholders.length >= placeholderLen, `错误码所需参数不匹配！需要 ${placeholderLen} 个（${message}），实际 ${placeholders.length} 个（${JSON.stringify(placeholders)}）`);

    placeholders.forEach((placeholder, index) => {
      message = message.replace(format(PLACEHOLDER, index), placeholder);
    });

    message = `${this.getPrefix(loglevel, code)}${message}`;
    return message;
  }

  getPrefix(loglevel: ErrorEnum, code: string): string {
    return `${this.prefix}${ErrorPrefix[loglevel]}${code}: `;
  }

  async getError(code: string): Promise<ErrorOptions> {
    const errorDataFunc = await import(path.join(this.path, code, CONFIG));
    const error = await errorDataFunc.default() as ErrorOptions;
    if (!Object.values(ErrorEnum).includes(error.loglevel as ErrorEnum)) {
      error.loglevel = ErrorEnum.Error;
    }

    if (!error.placeholders?.length) {
      error.placeholders = [];
    }

    const fixerPath = path.join(this.path, code, FIXER);
    try {
      await fs.stat(fixerPath);
      error.fix = true;
    } catch (_) {
      // do nothing
    }

    return error;
  }

  async fixOrNot(code: string, message: string, valid: boolean) {
    const error = await this.getError(code);
    if (valid === true) {
      return;
    }

    // error 抛异常
    if (error.loglevel === ErrorEnum.Error) {
      this.throw(message);
    }

    if (this.loglevelMatch(error)) {
      log[this.loglevel](message);
    }

    if (error.fix) {
      const fixerPath = path.join(this.path, code, FIXER);
      const prefix = this.getPrefix(error.loglevel!, code);

      const subprocess = cp.fork(fixerPath);
      const exitCode = await awaitEvent(subprocess, 'exit');
      if (exitCode === 0) {
        log.success(`${prefix}错误修复成功！`);
      } else {
        log.error(`${prefix}错误码修复失败，请手动或参照文档修复。${error.readme || ''}`);
      }
    }
  }

  throw(message: string) {
    log.error(message);
    process.exit(1);
  }

  loglevelMatch(error: ErrorOptions): boolean {
    return LoglevelDigit[this.loglevel] >= LoglevelDigit[error.loglevel!];
  }
}

export {
  ErrorRunner,
  ErrorEnum,
};