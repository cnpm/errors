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
  ERROR_IDENTIFIER,
} from "./constants";
import * as log from "./log";
import theDebug from 'debug';

const debug = theDebug('cnpmjs-errors');

async function readJSON(file: string): Promise<Record<string, string>> {
  const fileData = await fs.readFile(file, 'utf8');
  return JSON.parse(fileData);
}

class CNPMError extends Error {
  type: Symbol = ERROR_IDENTIFIER;
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.message = message;
    this.code = code;
  }
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
    if (Object.keys(this.i18nData).length > 0) {
      return;
    }
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
        this.i18nData = await readJSON(i18nPath);
      } catch (error) {
        debug('loadErrorData error: ', error);
        // use default lang configuration
      }
    }
  }

  async test(e: CNPMError) {
    const { code, message: errHint, type } = e;
    if (type !== ERROR_IDENTIFIER) {
      return;
    }
    await this.precheck(code, errHint);
    const valid = await this.runTest(code);
    const message = await this.generate(code, errHint);
    await this.fixOrNot(code, message, valid);
  }

  async precheck(code: string, errHint: string){
    assert(errHint && code, `错误码不存在：${code}, ${errHint}`);

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
    try {
      const tester = await import(testerPath);
      await tester.default();
      return true;
    } catch (error) {
      debug('runTest error: ', error);
      return false;
    }
  }

  async generate(code: string, errHint: string): Promise<string> {
    // 国际化
    let message = this.i18nData[errHint] || errHint;
    const error = await this.getError(code);
    const loglevel = error.loglevel || this.loglevel;
    const placeholders = error?.placeholders || [];
    const placeholderLen = message.match(/'\{\d+\}'/g)?.length || 0;
    assert(placeholders.length >= placeholderLen, `错误码所需参数不匹配！需要 ${placeholderLen} 个（${message}），实际 ${placeholders.length} 个（${JSON.stringify(placeholders)}）`);

    placeholders.forEach((placeholder, index) => {
      message = message.replace(format(PLACEHOLDER, index), placeholder);
    });

    message = `${this.getPrefix(loglevel, code)}${message}`;

    if (error.readme) {
      message = `${message}\n${this.getPrefix(loglevel, code)}参考文档，了解更多：${error.readme}`;
    }
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
    } catch (error) {
      debug('getFixer error: ', error);
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
        log.success(`${prefix}修复成功！`);
      } catch (err) {
        debug('run fixer error: ', err);
        log.error(`${prefix}修复失败，请手动或参照文档修复。${error.readme || ''}`);
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
  CNPMError,
};