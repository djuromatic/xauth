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

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/federated', urlencoded({ extended: true }), setNoCache, async (req, res, next) => {
    try {
      const {
        prompt: { name },
        uid,
        session
      } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');
      const { upstream } = req.body;

      switch (upstream) {
        case 'google': {
          const { code } = req.body;
          const { google } = serverConfig;
          //Callback from Google with a code and state
          if (code && req.body.state) {
            const result = await callback(req, google);
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
          //Redirect to Apple url
          const url = await login({ uid, nonce, state, code_challenge, upstream }, google);

          if (url) {
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
        await metamaskChecks(req.body);

        await setFederatedAccountUsername(req.body.sub, req.body.username);

        const account = await findBySub(req.body.sub);

        await linkAccount(account.accountId, req.body);

        const nonce = res.locals.cspNonce;

        return res.render('repost', {
          layout: false,
          upstream: 'google',
          uid: req.params.uid,
          nonce
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post('/interaction/callback/google', async (req: Request, res: Response) => {
    const { code, state } = req.body;

    const uid = state.split('|')[0];
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
