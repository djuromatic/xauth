/* eslint-disable no-console, camelcase, no-unused-vars */
import assert from 'node:assert';
import { NextFunction, Request, Response, urlencoded, Express } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';
import { findBySub, setFederatedAccountUsername } from '../service/account.service.js';
import { linkAccount, check as metamaskChecks } from '../helpers/metamask.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { login, callback, generateStateAndNonce } from '../service/federated.service.js';
import { generators } from 'openid-client';
import SsoLogin from '../models/login.js';
import { serverConfig } from '../config/server-config.js';
import { createProfileUpdateRequest, profileNeedsUpdate, renderProfileUpdatePage } from '../helpers/profile-update.js';
import { find as findProfileRequest } from '../service/profile-update.service.js';
import { debug } from '../helpers/debug.js';
import { MetamaskException, ProfileUpdateException } from '../common/errors/exceptions.js';
import { checkUsername } from '../helpers/input-checks.js';

import { Logger } from '../utils/winston.js';

const logger = new Logger('FederatedRouter');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    logger.debug(`Setting no cache for ${req.originalUrl}`);
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/federated', urlencoded({ extended: true }), setNoCache, async (req, res, next) => {
    logger.debug(`Interaction Federated [${req.originalUrl}] [${req.params['uid']}]  `);
    try {
      const {
        prompt: { name },
        uid,
        session
      } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');
      const { upstream } = req.body;

      logger.debug(`upstream: ${upstream}`);
      switch (upstream) {
        case 'google': {
          const { code } = req.body;
          const { google } = serverConfig;
          //Callback from Google with a code and state
          if (code && req.body.state) {
            logger.debug(
              `Interaction Federated [${req.originalUrl}] [${req.params['uid']}] [${req.body.state}] Callback from Google`
            );
            const result = await callback(req, google);

            const { accountId } = result.login;
            const needsProfileUpdate = await profileNeedsUpdate(accountId);
            if (needsProfileUpdate) {
              logger.debug(`profile needs update for ${accountId}`);
              const profileUpdateRequest = await createProfileUpdateRequest(accountId);
              await renderProfileUpdatePage(provider, req, res, profileUpdateRequest);
              return undefined;
            }

            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            return undefined;
          }

          //Initial request to Google with a state and nonce and code_challenge
          const { state, nonce } = generateStateAndNonce(uid);
          const code_verifier = generators.codeVerifier();
          const code_challenge = generators.codeChallenge(code_verifier);

          //Store the login request
          await SsoLogin.create({
            uid,
            nonce,
            state,
            code_verifier
          });

          //Redirect to Google url
          const url = await login({ uid, nonce, state, code_challenge, upstream }, google);

          if (url) {
            logger.debug(`redirecting to ${url}`);
            return res.redirect(url);
          } else {
            throw new Error('Error in google login');
          }
        }
        case 'apple': {
          const { code } = req.body;
          const { apple } = serverConfig;

          //Callback from Apple
          if (code && req.body.state) {
            const result = await callback(req, apple);

            const { accountId } = result.login;
            const needsProfileUpdate = await profileNeedsUpdate(accountId);
            if (needsProfileUpdate) {
              const profileUpdateRequest = await createProfileUpdateRequest(accountId);
              await renderProfileUpdatePage(provider, req, res, profileUpdateRequest);
              return undefined;
            }

            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            return undefined;
          }

          //Initial request to Apple
          const { state, nonce } = generateStateAndNonce(uid);
          const code_verifier = generators.codeVerifier();
          const code_challenge = generators.codeChallenge(code_verifier);

          //Store the login request
          await SsoLogin.create({
            uid,
            nonce,
            state,
            code_verifier
          });
          //Redirect to Apple url
          const url = await login({ uid, nonce, state, code_challenge, upstream }, apple);

          if (url) {
            return res.redirect(url);
          } else {
            throw new Error('Error in apple login');
          }
        }

        default:
          return undefined;
      }
    } catch (err) {
      next(err);
    }
  });

  app.post(
    '/interaction/:uid/federated/finish-registration',
    urlencoded({ extended: true }),
    setNoCache,
    async (req, res, next) => {
      const {
        prompt: { name }
      } = await provider.interactionDetails(req, res);

      try {
        const profileUpdateRequest = await findProfileRequest({ code: req.body.code });

        const errorDescription = (field: string, message: string) => {
          return JSON.stringify({ code: profileUpdateRequest.code, error: { field, message } });
        };

        if (!profileUpdateRequest) {
          throw new ProfileUpdateException(
            'Profile update error',
            errorDescription('updateRequest', 'Not a valid token'),
            404
          );
        }

        const usernameErrors = await checkUsername(req.body.username);
        if (usernameErrors.length > 0) {
          throw new ProfileUpdateException(
            'Profile update error',
            errorDescription('username', usernameErrors[0].desc),
            404
          );
        }

        try {
          await metamaskChecks(req.body);
        } catch (err) {
          if (err instanceof MetamaskException) {
            const message = JSON.parse(err.message).error.message;
            throw new ProfileUpdateException(err.description, errorDescription('metamask', message), err.status);
          }
        }
        await setFederatedAccountUsername(profileUpdateRequest.accountId, req.body.username);

        const account = await findBySub(profileUpdateRequest.accountId);

        await linkAccount(account.accountId, req.body);

        const result = { login: { accountId: account.accountId } };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });

        return undefined;
      } catch (err) {
        next(err);
      }
    }
  );

  app.post('/interaction/callback/google', async (req: Request, res: Response) => {
    const { code, state } = req.body;
    const uid = state.split('|')[0];
    logger.debug(`Interaction Federated [${req.originalUrl}] [${uid}] [${state}] Callback from Google`);
    return res.render('repost', {
      layout: false,
      upstream: 'google',
      uid,
      code,
      user: '',
      state,
      nonce: state
    });
  });

  app.post('/interaction/callback/apple', async (req: Request, res: Response) => {
    const { code, state, user } = req.body;

    const uid = state.split('|')[0];

    return res.render('repost', {
      layout: false,
      upstream: 'apple',
      uid,
      code,
      state,
      user,
      nonce: state
    });
  });

  interactionErrorHandler(app, provider);
};
