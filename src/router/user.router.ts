/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { Logger } from '../utils/winston.js';
import { adminGuard } from '../helpers/route-guards.js';
import cors from 'cors';
import { findAllAccounts } from '../service/account.service.js';
const logger = new Logger('Users Router');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.use('/users', cors());

  app.get('/users', setNoCache, adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await findAllAccounts();
      return res.json({ accounts });
    } catch (err) {
      return next(err);
    }
  });
};
