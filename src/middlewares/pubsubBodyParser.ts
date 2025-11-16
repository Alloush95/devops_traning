import express from 'express';
import { failure } from '../utils/apiResponse';
import { AppError, castToObject } from '../utils/errors';
import config from './../config';
import { VALIDATION_ERROR } from '../utils/constants';

const pubsubBodyParser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<express.Response | void> => {
  try {
    if (!req.body) {
      throw new AppError(`No Pubsub message received`, config.appName, VALIDATION_ERROR, 400, {
        requestId: req.id,
      });
    }

    if (!req.body.message) {
      throw new AppError(`Invalid Pubsub message format`, config.appName, VALIDATION_ERROR, 400, {
        requestId: req.id,
      });
    }

    if (!req.body.message?.data) {
      throw new AppError('Data is missing', config.appName, VALIDATION_ERROR, 400, {
        requestId: req.id,
      });
    }
    req.body.data = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString().trim());

    next();
  } catch (e: any) {
    const errorObject = castToObject(e);
    res.status(400).send(failure(VALIDATION_ERROR, errorObject, 400));
  }
};

export default pubsubBodyParser;
