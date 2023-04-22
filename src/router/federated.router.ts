/* eslint-disable no-console, camelcase, no-unused-vars */
import assert from 'node:assert';
import { NextFunction, Request, Response, urlencoded, Express } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';
import { GoogleService } from '../service/google.service.js';

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post('/interaction/:uid/federated', urlencoded({ extended: true }), async (req, res) => {
    const {
      prompt: { name }
    } = await provider.interactionDetails(req, res);
    assert.equal(name, 'login');
    const path = `/interaction/${req.params.uid}/federated`;
    const { upstream } = req.body;

    switch (upstream) {
      case 'google': {
        // const callbackParams = req.google.callbackParams(req) as any;

        return new GoogleService(req, res, provider, path, req.body).login();
      }

      default:
        return undefined;
    }
  });

  app.get('/interaction/callback/google', async (req: Request, res: Response) => {
    //TODO: Fix Nonce
    const nonce = res.locals.cspNonce;
    return res.render('repost', {
      layout: false,
      upstream: 'google',
      nonce
    });
  });
};
