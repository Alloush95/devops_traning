import { LoggerOptions } from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

import winston from 'winston';
import config from './../config';

const loggingWinston = new LoggingWinston({
  logName: `${config.appName}_log`,
  silent: config.unitTest !== 'false',
});

const options: LoggerOptions = {
  transports: [
    new winston.transports.Console({
      format:
        config.environment === 'local'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.simple(),
    }),
    loggingWinston,
  ],
  // TODO: the level must be set consciously
  level: 'info',
  exitOnError: false,
};

export default winston.createLogger(options);
