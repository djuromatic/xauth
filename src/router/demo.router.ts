import assert from 'node:assert';
import { NextFunction, Request, Response, urlencoded, Express } from 'express';
import Provider from 'oidc-provider';
import { UnauthorizedException } from '../common/errors/exceptions.js';
import crypto from 'crypto';
import DemoService from '../service/demo-account.service.js';

import { Logger } from '../utils/winston.js';

const logger = new Logger('Demo Router');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/demo/login', urlencoded({ extended: true }), setNoCache, async (req, res, next) => {
    try {
      const {
        prompt: { name },
        uid
      } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');
      const nonce = crypto.randomBytes(32).toString('hex');

      return res.render('fingerprint', {
        layout: false,
        upstream: 'demo',
        nonce,
        uid
      });
    } catch (error) {
      provider.interactionFinished(req, res, {
        error: 'server_error',
        error_description: error.message
      });
      logger.error(error);
      next(error);
    }
  });

  app.post('/interaction/:uid/demo/repost', urlencoded({ extended: true }), setNoCache, async (req, res, next) => {
    try {
      const {
        prompt: { name }
      } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');

      const { upstream, fingerprint } = req.body;

      if (upstream !== 'demo') {
        throw new UnauthorizedException('Invalid upstream');
      }

      const demo = await DemoService.login(fingerprint);

      const result = {
        login: {
          accountId: demo.accountId
        }
      };
      return provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true
      });
    } catch (error) {
      logger.error(error);
      next(error);
      // return provider.interactionFinished(req, res, { error_description: error.description, error: error });
    }
  });
};
