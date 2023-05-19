/* eslint-disable no-console, camelcase, no-unused-vars */
import { Express } from 'express';
import { utils } from 'ethers';

import { NextFunction, Request, Response } from 'express'; // eslint-disable-line import/no-unresolved
import Provider from 'oidc-provider';

import { findByEthAddress } from '../service/account.service.js';
import { interactionErrorHandler } from '../common/errors/interaction-error-handler.js';
import { generateNonce } from '../helpers/metamask.js';
import { Logger } from '../utils/winston.js';

import { create as createNonceRequest } from '../service/nonce-request.service.js';
import { LoginException } from '../common/errors/exceptions.js';

const logger = new Logger('MetamaskRouter');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post(
    '/interaction/:uid/metamask/request-nonce',
    setNoCache,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { uid, params } = await provider.interactionDetails(req, res);

        await provider.Client.find(params.client_id as any);

        const nonce = generateNonce();

        await createNonceRequest({ interactionId: uid, nonce });

        return res.json({ nonce });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post('/interaction/:uid/metamask/login', setNoCache, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await provider.interactionDetails(req, res);

      const { metamask_nonce, metamask_signature } = req.body as any;

      const ethAddress = utils.verifyMessage(metamask_nonce, metamask_signature);

      const account = await findByEthAddress(ethAddress);

      if (!account) {
        throw new LoginException('No Account has been linked with that address', 'Metmask Error', 404);
      }

      const result = {
        login: {
          accountId: account.accountId
        }
      };
      return provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false
      });
    } catch (err) {
      next(err);
    }
  });
};
