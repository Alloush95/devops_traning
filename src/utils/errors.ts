import config from './../config';
import { INTERNAL_SERVER_ERROR } from './constants';

export class AppError extends Error {
  public message: string = '';
  public code: string;
  public status: number;
  public serviceName: string;
  public details: any;

  constructor(
    message: string,
    serviceName: string = config.appName,
    code: string = INTERNAL_SERVER_ERROR,
    status: number = 500,
    details: any = [],
  ) {
    super();
    this.message = message;
    this.serviceName = serviceName;
    this.code = code;
    this.status = status;
    this.details = details || [];
  }
}

export const castToObject = <E extends Error>(e: E): { [key: string]: any } => {
  const errorObject: { [key: string]: any } = {};
  Object.getOwnPropertyNames(e).forEach(
    (name: string) => (errorObject[name] = e[name as keyof object]),
  );
  return errorObject;
};
