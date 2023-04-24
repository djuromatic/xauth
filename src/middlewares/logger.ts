import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/winston.js';

const logger = new Logger('HTTP');

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(req.method + ' ' + req.originalUrl);
  next();
};
