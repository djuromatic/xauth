import { Issuer, generators } from 'openid-client';
import { FederatedLoginConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';
import { Request } from 'express';
import SsoLogin from '../models/login.js';
import { createFederatedAccount, findByFederated } from './account.service.js';
import { UnauthorizedException } from '../common/errors/exceptions.js';
import { ProviderName } from '../common/enums/provider.js';
const logger = new Logger('AppleService');

export type FederatedLogin = {
  uid: string;
  nonce: string;
  state: string;
  code_challenge: string;
  upstream: ProviderName;
};

export const login = async (login: FederatedLogin, config: FederatedLoginConfig): Promise<string> => {
  const { nonce, state, code_challenge, upstream } = login;
  const issuer = await Issuer.discover(config.issuerUrl);
  const client = new issuer.Client({
    client_id: config.clientID,
    redirect_uris: [config.redirectUri]
  });
  let params;
  if (upstream === ProviderName.APPLE) {
    params = {
      grant_type: 'authorization_code',
      scope: 'openid name email',
      response_mode: 'form_post',
      code_challenge,
      nonce,
      state,
      token_endpoint_auth_method: 'none'
    };
  }
  if (upstream === ProviderName.GOOGLE) {
    params = {
      scope: 'openid profile email',
      response_mode: 'form_post',
      code_challenge,
      code_challenge_method: 'S256',
      nonce,
      state,
      token_endpoint_auth_method: 'none'
    };
  }

  const url = client.authorizationUrl(params);
  return url;
};

export const callback = async (req: Request, config: FederatedLoginConfig) => {
  try {
    const { user, upstream } = req.body;
    let account;

    //get the openid client
    const client = await getClient(config, upstream);
    //parse the callback params from the request
    const params = client.callbackParams(req);
    //get the stored login request
    const { code_verifier, nonce, state } = await SsoLogin.findOne({ uid: params.state.split('|')[0] });
    //exchange the code for the token
    const tokenSet = await client.callback(config.redirectUri, params, { state, nonce, code_verifier });
    //sub is the unique identifier for the user
    const sub = `${tokenSet.claims().sub}`;
    account = await findByFederated(upstream, sub);
    // apple send user only first time
    if (!account) {
      account = await createFederatedAccount(sub, upstream, tokenSet, user);
    }

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    //return the account id
    const result = {
      login: {
        accountId: account.accountId
      }
    };

    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const generateStateAndNonce = (uid: string) => {
  const nonce = generators.nonce(); // Generate nonce
  const state = `${uid}|${generators.state()}`; // Generate state

  return { nonce, state };
};

async function getClient(config: FederatedLoginConfig, upstream: ProviderName) {
  const issuer = await Issuer.discover(config.issuerUrl);
  let client;
  if (upstream === ProviderName.APPLE) {
    client = new issuer.Client({
      client_id: config.clientID,
      client_secret: config.clientSecret,
      scope: 'name email',
      redirect_uris: [config.redirectUri],
      response_types: ['id_token'],
      id_token_signed_response_alg: 'RS256'
    });
  }
  if (upstream === ProviderName.GOOGLE) {
    client = new issuer.Client({
      client_id: config.clientID,
      client_secret: config.clientSecret,
      scope: 'openid profile email offline_access',
      redirect_uris: [config.redirectUri],
      response_types: ['id_token'],
      id_token_signed_response_alg: 'RS256'
    });
  }

  return client;
}
