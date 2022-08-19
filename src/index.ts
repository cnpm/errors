import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { format } from 'util';
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
  ERR_CONFIG,
  DEFAULT_LANG,
} from "./constants";
import * as log from "./log";

async function readJSON(file: string): Promise<Record<string, string>> {
  const fileData = await fs.readFile(file, 'utf8');
  return JSON.parse(fileData);
}

// 错误码配置
class ErrorRunner {
  loglevel: ErrorEnum;
  path: string;
  lang: string;
  prefix: string;
  errorData: Record<string, Record<'code' | 'errHint', string>>;
  i18nData: Record<string, string>;

  constructor(options: ErrorRunnerOptions) {
    this.loglevel = options.loglevel || ErrorEnum.Error;
    this.path = options.path;
    this.lang = (options.lang || Intl.DateTimeFormat().resolvedOptions().locale).toLowerCase();
    this.prefix = options.prefix || '[@cnpmjs/errors]';
    this.errorData = {};
    this.i18nData = {};
  }

  async loadErrorData() {
    const errorCodePath = path.join(this.path, ERR_CONFIG);
    try {
      await fs.stat(errorCodePath);
    } catch (error) {
      throw new Error(`${errorCodePath} 文件不存在`);
    }

    if (this.lang !== DEFAULT_LANG) {
      const i18nPath = path.join(this.path, `${this.lang}.json`);

      try {
        await fs.stat(i18nPath);
      } catch (error) {
        throw new Error(`${i18nPath} 文件不存在`);
      }
      this.i18nData = await readJSON(i18nPath);
    } else {
      this.i18nData = {};
    }

    if (!Object.keys(this.errorData).length) {
      const obj = await readJSON(errorCodePath);

      Object.entries(obj).forEach(([errHint, code]) => {
        this.errorData[errHint] = {
          code,
          errHint: this.i18nData[errHint] || errHint,
        };
      });
    }
  }

  async test(errHint: string) {
    const code = await this.precheck(errHint);
    const valid = await this.runTest(code);
    const message = await this.generate(errHint);
    await this.fixOrNot(code, message, valid);
  }

  async precheck(errHint: string): Promise<string> {
    assert(errHint, `错误码不存在：${errHint}`);

    const err = this.errorData[errHint];
    assert(err, `未配置错误：${errHint}`);

    const code = this.errorData[errHint].code;
    assert(code, `未配置错误码：${errHint}`);

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

    return code;
 }

  async runTest(code: string): Promise<boolean> {
    const testerPath = path.join(this.path, code, TESTER);
    try {
      const tester = await import(testerPath);
      await tester.default();
      return true;
    } catch (_) {
      return false;
    }
  }

  async generate(errHint: string): Promise<string> {
    // 国际化
    let message = this.errorData[errHint].errHint;
    const code = this.errorData[errHint].code;
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

      try {
        const fixer = await import(fixerPath);
        await fixer.default();
        log.success(`${prefix}错误修复成功！`);
      } catch (_) {
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