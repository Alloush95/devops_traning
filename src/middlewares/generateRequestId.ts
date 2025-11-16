import express from 'express';
import { randomUUID } from 'crypto';

const generateRequestId = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  req.id = randomUUID();
  next();
};

export default generateRequestId;
