import { ErrorEnum } from './constants';

export interface ErrorOptions {
  code: string; // 错误代码
  placeholders?: string[]; // 错误提示展位符替换字段
  loglevel?: ErrorEnum; // 日志级别
  fix?: boolean; // 是否自动修复
  readme: string; // 错误说明文档
}

export interface ErrorRunnerOptions {
  path: string; // 错误码配置目录
  lang: string; // 语言
  loglevel?: ErrorEnum; // 日志级别
  prefix?: string; // 错误码前缀
}
