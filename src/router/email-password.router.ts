/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import {
  create as createAccount,
  findAccount,
  findByEmail,
  updateAccountVerificationStatus,
  findAccountByAccountId
} from '../service/account.service.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { debug } from '../helpers/debug.js';
import { check as emailPasswordSignupCheck, addAdditionalUserInfoToReq } from '../helpers/email-password-signup.js';
import { Logger } from '../utils/winston.js';
import {
  create as createEmailVerification,
  find as findEmailVerification,
  remove as removeEmailVerification
} from '../service/email-verification.service.js';
import {
  create as createUnverifiedEmailLoginAttempt,
  find as findUnverifiedEmailLoginAttempt,
  remove as removeUnverifiedEmailLoginAttempt
} from '../service/unverified-email-login-attempt.service.js';
import { generateEmailCode, sendEmail } from '../helpers/email-verification.js';
import { serverConfig } from '../config/server-config.js';
import { linkAccount, check as metamaskChecks } from '../helpers/metamask.js';

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
        serverData: '{}',
        details: prompt.details,
        params,
        validationFcn: () => {
          logger.debug('validation function called');
        },
        title: '',
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
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id as any);

      addAdditionalUserInfoToReq(req);

      await emailPasswordSignupCheck(req.body);
      await metamaskChecks(req.body);

      const account = await createAccount(req.body);
      await linkAccount(account.accountId, req.body);

      const xauthCode = generateEmailCode();
      await createEmailVerification({ accountId: account.accountId, code: xauthCode });

      await sendEmail(
        account.profile.email,
        account.profile.username,
        `https://${serverConfig.hostname}/interaction/${uid}/signup-verification/${xauthCode}`
      );

      await createUnverifiedEmailLoginAttempt({ interactionId: uid, accountId: account.accountId });

      return res.render('email-not-verified', {
        client,
        uid,
        details: prompt.details,
        params,
        title: 'Email sent',
        emailResendlink: `/interaction/${uid}/signup-resend-email/${req.body.email}`,
        message: `Verification email has been sent. If you can't find it, please check your Spam box too.`,
        session: session ?? undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt)
        }
      });
    } catch (err) {
      next(err);
    }
  });

  app.get(
    '/interaction/:uid/signup-resend-email/:email',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const account = await findByEmail(req.params.email);

        const xauthCode = generateEmailCode();

        await createEmailVerification({ accountId: account.accountId, code: xauthCode });

        await sendEmail(
          account.profile.email,
          account.profile.username,
          `https://${serverConfig.hostname}/interaction/${uid}/signup-verification/${xauthCode}`
        );

        return res.render('email-not-verified', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Email sent',
          emailResendlink: `/interaction/${uid}/signup-resend-email/${req.body.email}`,
          message: `Verification email has been sent. If you can't find it, please check your Spam box too.`,
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
    '/interaction/:uid/signup-verification/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const xauthCode = req.params.xauthCode;
        const emailVerification = await findEmailVerification({ code: xauthCode });
        const xauthCodeIsValid = emailVerification != null;

        if (xauthCodeIsValid) {
          const accountId = emailVerification.accountId;
          await updateAccountVerificationStatus(accountId, true);
          await removeEmailVerification({ code: xauthCode });

          return res.render('landing', {
            client,
            uid,
            details: prompt.details,
            params,
            email: req.body.email,
            title: 'Your account has been verified',
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
            title: 'Not a valid verification link',
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
    '/interaction/:uid/continue-without-verification',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        const loginAttempt = await findUnverifiedEmailLoginAttempt({ interactionId: uid });

        if (!loginAttempt) {
          return res.redirect(`/interaction/${uid}`);
        }

        const account = await findAccountByAccountId(loginAttempt.accountId);
        if (!account) {
          return res.redirect(`/interaction/${uid}`);
        }

        await removeUnverifiedEmailLoginAttempt({ interactionId: uid });

        const result = { login: { accountId: loginAttempt.accountId } };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false
        });
        // return res.redirect(`/interaction/${uid}`);
      } catch (err) {
        logger.error(err.message);
        next(err);
      }
    }
  );

  interactionErrorHandler(app, provider);
};
