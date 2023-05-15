/* eslint-disable no-console, camelcase, no-unused-vars */
import assert from 'node:assert';
import { NextFunction, Request, Response, urlencoded, Express } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';
import { GoogleService } from '../service/google.service.js';
import { findBySub, setFederatedAccountUsername } from '../service/account.service.js';
import { linkAccount, check as metamaskChecks } from '../helpers/metamask.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { login, callback, generateStateAndNonce } from '../service/apple.service.js';
import { generators } from 'openid-client';
import SsoLogin from '../models/login.js';

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/federated', urlencoded({ extended: true }), setNoCache, async (req, res) => {
    const {
      prompt: { name },
      uid,
      session
    } = await provider.interactionDetails(req, res);
    assert.equal(name, 'login');
    const { upstream } = req.body;

    switch (upstream) {
      case 'google': {
        return new GoogleService(req, res, provider).login();
      }
      case 'apple': {
        const { code } = req.body;

        if (code && req.body.state) {
          const result = await callback(req);
          await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
          return undefined;
        }

        const { state, nonce } = generateStateAndNonce(uid);
        const code_verifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(code_verifier);

        await SsoLogin.create({
          uid,
          nonce,
          state,
          code_verifier
        });

        const url = await login({ uid, nonce, state, code_challenge });

        if (url) {
          res.redirect(url);
        }
      }

      default:
        return undefined;
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

  app.get('/interaction/callback/google', async (req: Request, res: Response) => {
    //TODO: Fix Nonce
    const nonce = res.locals.cspNonce;
    return res.render('repost', {
      layout: false,
      upstream: 'google',
      uid: 'none',
      nonce
    });
  });

  app.post('/interaction/callback/apple', async (req: Request, res: Response) => {
    const { code, state, user } = req.body;

    const uid = state.split('|')[0];

    return res.render('repostapple', {
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
