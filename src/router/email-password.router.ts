/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { create as createAccount, updateAccountVerificationStatus } from '../service/account.service.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { debug } from '../helpers/debug.js';
import { check as emailPasswordSignupCheck } from '../helpers/email-password-signup.js';
import { Logger } from '../utils/winston.js';

import {
  create as createEmailVerification,
  find as findEmailVerification,
  remove as removeEmailVerification
} from '../service/email-verification.service.js';
import account from '../models/account.js';
import { generateEmailCode, sendEmail } from '../helpers/email-verification.js';
import { serverConfig } from '../config/server-config.js';

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
      const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id as any);

      await emailPasswordSignupCheck(req.body);

      const account = await createAccount(req.body);
      const xauthCode = generateEmailCode();

      await createEmailVerification({ accountId: account.accountId, code: xauthCode });

      await sendEmail(
        account.profile.email,
        'username:placeholder', //TODO:change when the Account schema is updated
        `https://${serverConfig.hostname}/interaction/${uid}/signup-verification/${xauthCode}`
      );

      return res.render('email-sent', {
        client,
        uid,
        details: prompt.details,
        params,
        title: 'Email sent',
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
    '/interaction/:uid/signup-verification/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      // const { uid, xauthCode } = req.params;
      // logger.info(uid + ' ---- ' + xauthCode);
      // const response = await fetch(
      //   `https://${serverConfig.hostname}/interaction/${req.params.uid}/signup-verification/${req.params.xauthCode}`,
      //   {
      //     method: 'POST',
      //     mode: 'cors', // no-cors, *cors, same-origin
      //     cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      //     credentials: 'same-origin', // include, *same-origin, omit
      //     redirect: 'follow', // manual, *follow, error
      //     referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      //     body: JSON.stringify({ uid, xauthCode })
      //   }
      // );
      // logger.info(JSON.stringify(response));
      // return response;
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
    '/interaction/:uid/signup-verification/:xauthCode',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        logger.info(`getting uid`);

        const { uid, prompt, params, session } = await provider.interactionDetails(req, res);

        const client = await provider.Client.find(params.client_id as any);

        logger.info(`getting xauthCode`);

        const xauthCode = req.params.xauthCode;
        const emailVerification = await findEmailVerification({ code: xauthCode });
        const xauthCodeIsValid = emailVerification != null;

        logger.info(`xauthCodeIsValid ${xauthCodeIsValid}`);

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
  interactionErrorHandler(app, provider);
};
