/* eslint-disable no-console, camelcase, no-unused-vars */
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { Express } from 'express';

import isEmpty from 'lodash/isEmpty.js';
import { NextFunction, Request, Response, urlencoded } from 'express'; // eslint-disable-line import/no-unresolved
import Provider, { InteractionResults } from 'oidc-provider';

import { findByEmail, create as createAccount, updateAccountPassword } from '../service/account.service.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { debug } from '../helpers/debug.js';

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.get(
    '/interaction/:uid/forgot-password-init',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        return res.render('forgot-password', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Forgot password',
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post('/interaction/:uid/forgot-password', setNoCache, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id as any);

      const account = await findByEmail(req.body.email);

      if (!account) {
        return res.render('non-existent-email', {
          client,
          uid,
          details: prompt.details,
          params,
          email: req.body.email,
          title: 'That email does not exist',
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      } else {
        //TODO send the actual email through an email-service
        return res.render('email-sent', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Email sent',
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      }
    } catch (err) {
      next(err);
    }
  });

  app.get(
    '/interaction/:uid/new-password/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const xauthCode = req.params.xauthCode;

        //TODO: check if the xauthCode is valid
        const xauthCodeIsValid = true;

        //TODO: retrieve the accountId based on code
        const accountId = 'bojinovicc@hotmail.com';

        if (xauthCodeIsValid) {
          // await updateAccountPassword(accountId, req.body.password);
          return res.render('new-password', {
            client,
            uid,
            details: prompt.details,
            params,
            xauthCode,
            email: req.body.email,
            title: 'Enter new password',
            session: session ?? undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          });
        } else {
          return res.render('non-valid-code', {
            client,
            uid,
            details: prompt.details,
            params,
            email: req.body.email,
            title: 'Not a valid password reset code',
            session: session ?? undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          });
        }
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/interaction/:uid/new-password/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        //TODO: check if the xauthCode is valid
        const xauthCodeIsValid = true;

        //TODO: retrieve the accountId based on code
        const accountId = 'bojinovicc@hotmail.com';
        console.log(123);

        if (xauthCodeIsValid) {
          // TODO: uncomment
          await updateAccountPassword(accountId, req.body.password);
          return res.render('landing', {
            client,
            uid,
            details: prompt.details,
            params,
            email: req.body.email,
            title: 'Password has been reset',
            session: session ?? undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          });
        } else {
          return res.render('non-valid-code', {
            client,
            uid,
            details: prompt.details,
            params,
            email: req.body.email,
            title: 'Not a valid password reset code',
            session: session ?? undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt)
            }
          });
        }
      } catch (err) {
        next(err);
      }
    }
  );
  interactionErrorHandler(app, provider);
};
