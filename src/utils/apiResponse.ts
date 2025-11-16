import logger, { LogMetadata } from './logger';
import config from '../config';

export type ApiResponseSuccess = { message: string; metadata: LogMetadata };
export type ApiResponseFailure = { errorMessage: string; metadata: LogMetadata };

export const success = (message: string, metadata: LogMetadata): ApiResponseSuccess => {
  logger.info(message, metadata);
  return { message, metadata };
};
export const failure = (
  errorMessage: string,
  metadata: LogMetadata,
  statusCode = 500,
): ApiResponseFailure => {
  const statusMessage = config.status(statusCode);
  logger.error(errorMessage, { statusCode, statusMessage, ...metadata });
  return { errorMessage, metadata };
};
