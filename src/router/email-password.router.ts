/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { create as createAccount } from '../service/account.service.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { debug } from '../helpers/debug.js';
import { check as emailPasswordSignupCheck } from '../helpers/email-password-signup.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('SignupRouter');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/signup-init', setNoCache, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);
      logger.debug('init', { uid, prompt, params, session });

      const client = await provider.Client.find(params.client_id as any);

      return res.render('signup', {
        client,
        uid,
        details: prompt.details,
        params,
        validationFcn: () => {
          logger.debug('validation function called');
        },
        title: 'Sign-Up',
        session: session ?? undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/interaction/:uid/signup', setNoCache, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        prompt: { name },
        params
      } = await provider.interactionDetails(req, res);

      await emailPasswordSignupCheck(req.body);

      await createAccount(req.body);

      const result = {
        m13: 'ok'
      };
      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true
      });
    } catch (err) {
      next(err);
    }
  });
  interactionErrorHandler(app, provider);
};
