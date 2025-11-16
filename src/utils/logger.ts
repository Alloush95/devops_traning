import config from './../config';
import winstonLogger from './winstonLogger';
import { Logger as WinstonLogger } from 'winston';

export type LogMetadata = { [name: string]: any };
export type Log = (message: string, meta?: LogMetadata) => WinstonLogger;

export interface LoggerInterface {
  error: Log;
  warn: Log;
  info: Log;
}

export class Logger implements LoggerInterface {
  readonly #appName: string;
  #logger: WinstonLogger;

  constructor(logger: WinstonLogger, appName: string) {
    this.#appName = appName;
    this.#logger = logger;
  }

  error(message: string, metadata?: LogMetadata): WinstonLogger {
    return this.#logger.error(`${this.#appName}: ${message}`, metadata);
  }

  warn(message: string, metadata?: LogMetadata): WinstonLogger {
    return this.#logger.warn(`${this.#appName}: ${message}`, metadata);
  }

  info(message: string, metadata?: LogMetadata): WinstonLogger {
    return this.#logger.info(`${this.#appName}: ${message}`, metadata);
  }

  getLogger() {
    return this.#logger;
  }
}

export default new Logger(winstonLogger, config.appName);
