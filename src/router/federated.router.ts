/* eslint-disable no-console, camelcase, no-unused-vars */
import assert from 'node:assert';
import crypto from 'crypto';
import { NextFunction, Request, Response, urlencoded, Express } from 'express'; // eslint-disable-line import/no-unresolved
import Provider, { InteractionResults } from 'oidc-provider';
import { serverConfig } from '../config/server-config.js';
import { ProviderName } from '../common/enums/provider.js';
import {
  findByFederated,
  createFederatedAccount
} from '../service/account.service.js';
import { UnauthorizedException } from '../common/errors/exceptions.js';
import axios from 'axios';
import qs from 'qs';
import { Logger } from '../utils/winston.js';
import { GoogleService } from '../service/google.service.js';

const logger = new Logger('federated');

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.post(
    '/interaction/:uid/federated',
    urlencoded({ extended: true }),
    async (req, res) => {
      const {
        prompt: { name },
        params: { client_id },
        session
      } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');
      const path = `/interaction/${req.params.uid}/federated`;
      const { upstream } = req.body;

      switch (upstream) {
        case 'google': {
          // const callbackParams = req.google.callbackParams(req) as any;

          return googleLogin(req, res, provider, path, req.body);
        }

        default:
          return undefined;
      }
    }
  );

  app.get(
    '/interaction/callback/google',
    async (req: Request, res: Response) => {
      const nonce = res.locals.cspNonce;
      return res.render('repost', {
        layout: false,
        upstream: 'google',
        nonce
      });
    }
  );
};

async function googleLogin(
  req: Request,
  res: Response,
  provider: Provider,
  path: string,
  callbackParams: any
) {
  // init
  if (!callbackParams.id_token) {
    const state = `${req.params.uid}|${crypto.randomBytes(32).toString('hex')}`;
    const nonce = crypto.randomBytes(32).toString('hex');

    res.status(303);

    const requestParams = {
      client_id: serverConfig.google.clientID,
      redirect_uri: serverConfig.google.redirectUri,
      scope: 'openid email profile',
      response_type: 'id_token token',
      state
    };

    return res.redirect(GoogleService.redirectAuthorizeUrl(requestParams));
  }
  //decode id_token
  const idToken = callbackParams.id_token;
  const decodedClaims = Buffer.from(idToken.split('.')[1], 'base64').toString(
    'utf8'
  );
  const claims = JSON.parse(decodedClaims);
  console.log(claims);

  let account = await findByFederated(ProviderName.GOOGLE, claims);

  if (!account) {
    const userInfo = await requestWithBearerToken(
      callbackParams.access_token,
      'https://www.googleapis.com/oauth2/v3/userinfo'
    );
    const accountId = `${ProviderName.GOOGLE}|${claims.sub}`;
    const profile = {
      sub: accountId,
      ...claims,
      ...userInfo
    };
    account = await createFederatedAccount(accountId, profile);
  }

  const result = {
    login: {
      accountId: account.accountId
    }
  };
  return provider.interactionFinished(req, res, result, {
    mergeWithLastSubmission: false
  });
}

const requestWithBearerToken = async (accessToken: string, url: string) => {
  try {
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };

    const result = await axios.get(url, options);

    return result.data;
  } catch (error) {
    logger.error(error);
    throw new UnauthorizedException("Can't get user info");
  }
};
