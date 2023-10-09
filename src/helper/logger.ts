import chalk from 'chalk';
import moment from 'moment-timezone';

export class Logger {
  public static info(...messages: any[]) {
    this.logger(chalk.cyan('INFO'), ...messages)
  }

  public static warn(...messages: any[]) {
    this.logger(chalk.yellow('WARN'), ...messages)
  }

  public static error(...messages: any[]) {
    this.logger(chalk.red('ERROR'), ...messages)
  }

  public static success(...messages: any[]) {
    this.logger(chalk.green('SUCCESS'), ...messages)
  }

  public static debug(enable: boolean, ...messages: any[]) {
    if (!enable) return
    this.logger(chalk.magenta('DEBUG'), ...messages)
  }

  public static log(title: string, ...messages: any[]) {
    this.logger(title, ...messages)
  }

  private static logger(title: string, ...messages: any[]) {
    const time  = moment().utcOffset('+07:00').format('HH:mm:ss')
    console.log(`[${chalk.yellow.underline(time)}] ${title} »`, ...messages)
  }
}
