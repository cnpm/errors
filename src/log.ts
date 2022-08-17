import chalk from 'chalk';

export function info(message: string): void {
  console.log(chalk.blue(message));
}

export function warning(message:string): void {
  console.log(chalk.yellow(message));
}

export function error(message: string): void {
  console.log(chalk.red(message));
}

export function success(message: string): void {
  console.log(chalk.green(message));
}
