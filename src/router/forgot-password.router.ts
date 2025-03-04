/* eslint-disable no-console, camelcase, no-unused-vars */

import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { findByEmail, updateAccountPassword } from '../service/account.service.js';
import {
  create as createPasswordResetRequest,
  find as findPasswordResetRequest,
  remove as removePasswordResetRequest
} from '../service/password-reset-request.service.js';
import { debug } from '../helpers/debug.js';
import { generateEmailCode, sendEmail as sendForgottenPasswordEmail } from '../helpers/forgoten-password.js';
import { serverConfig } from '../config/server-config.js';
import { PasswordReplacementException, PasswordResetException } from '../common/errors/exceptions.js';
import { checkPassword } from '../helpers/input-checks.js';

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
          serverData: '{}',
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

      const { email } = req.body;

      const account = await findByEmail(email);

      if (!account) {
        throw new PasswordResetException(
          '',
          JSON.stringify({ email, error: { field: 'email', message: `Email not registered` } }),
          200
        );
      } else {
        const xauthCode = generateEmailCode();

        await createPasswordResetRequest({ accountId: account.accountId, code: xauthCode });

        await sendForgottenPasswordEmail(
          account.profile.email,
          account.profile.username,
          `https://${serverConfig.hostname}/interaction/${uid}/new-password/${xauthCode}`
        );

        return res.render('email-sent', {
          client,
          uid,
          details: prompt.details,
          params,
          email,
          link: `/interaction/${uid}/forgot-password-resend-email/${req.body.email}`,
          title: 'Email sent',
          message: `Your username and password reset link has been succefully sent.\nCan find it? Pleasec check your Spam box too.`,
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
    '/interaction/:uid/forgot-password-resend-email/:email',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const account = await findByEmail(req.params.email);

        const xauthCode = generateEmailCode();

        await createPasswordResetRequest({ accountId: account.accountId, code: xauthCode });

        await sendForgottenPasswordEmail(
          account.profile.email,
          account.profile.username,
          `https://${serverConfig.hostname}/interaction/${uid}/new-password/${xauthCode}`
        );

        return res.render('email-sent', {
          client,
          uid,
          details: prompt.details,
          params,
          email: req.body.email,
          link: '',
          title: 'Email sent',
          message: `Your username and password reset link has been succefully sent.\nCan find it? Pleasec check your Spam box too.`,
          session: session ?? undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt)
          }
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.get(
    '/interaction/:uid/new-password/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const xauthCode = req.params.xauthCode;

        const emailVerification = await findPasswordResetRequest({ code: xauthCode });
        const xauthCodeIsValid = emailVerification != null;

        if (xauthCodeIsValid) {
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

        const { password } = req.body;

        const passwordErrors = checkPassword(password);
        if (passwordErrors.length > 0) {
          throw new PasswordReplacementException('Bad password replacemeent attempt', passwordErrors[0].desc, 200);
        }

        const client = await provider.Client.find(params.client_id as any);

        const xauthCode = req.params.xauthCode;

        const emailVerification = await findPasswordResetRequest({ code: xauthCode });
        const xauthCodeIsValid = emailVerification != null;

        if (xauthCodeIsValid) {
          const accountId = emailVerification.accountId;

          await updateAccountPassword(accountId, req.body.password);

          await removePasswordResetRequest({ code: xauthCode });

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
};
