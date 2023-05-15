import { Issuer, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';
import { Request } from 'express';
import SsoLogin from '../models/login.js';
import { createFederatedAccount } from './account.service.js';
const logger = new Logger('AppleService');

export type AppleLogin = {
  uid: string;
  nonce: string;
  state: string;
  code_challenge: string;
};

export const login = async (login: AppleLogin): Promise<string> => {
  const { apple } = serverConfig;

  const { nonce, state, code_challenge } = login;
  const issuer = await Issuer.discover(apple.issuerUrl);
  const client = new issuer.Client({
    client_id: apple.clientID,
    redirect_uris: [apple.redirectUri]
  });

  const authOptions = {
    grant_type: 'authorization_code',
    scope: 'openid name email',
    response_mode: 'form_post',
    code_challenge,
    nonce,
    state,
    token_endpoint_auth_method: 'none'
  };

  const url = client.authorizationUrl(authOptions);
  logger.debug(url);
  return url;
};

export const callback = async (req: Request) => {
  try {
    const { apple } = serverConfig;
    const { user, upstream } = req.body;

    const removeHtmlEntities = user.replace(/&#34;/g, '"');
    const parsedUser = JSON.parse(removeHtmlEntities);

    const userObj = {
      given_name: parsedUser.name.firstName,
      family_name: parsedUser.name.lastName,
      email: parsedUser.email
    };

    const issuer = await Issuer.discover(apple.issuerUrl);
    const client = new issuer.Client({
      client_id: apple.clientID,
      client_secret: apple.clientSecret,
      scope: 'name email',
      redirect_uris: [apple.redirectUri],
      response_types: ['id_token'],
      id_token_signed_response_alg: 'RS256'
    });

    const params = client.callbackParams(req);
    const { code_verifier, nonce, state } = await SsoLogin.findOne({ uid: params.state.split('|')[0] });
    const tokenSet = await client.callback(apple.redirectUri, params, { state, nonce, code_verifier });

    const aId = `${upstream}|${tokenSet.claims().sub}`;

    const profile = {
      ...getClaimsFromIdToken(tokenSet.id_token),
      ...userObj,
      locale: 'en',
      username: userObj.email, //TODO change this it is not part of this pr
      sub: aId
    };
    const account = await createFederatedAccount(aId, profile);

    const result = {
      login: {
        accountId: account.accountId
      }
    };

    return result;
  } catch (error) {
    logger.error(error);
  }
};

export const generateStateAndNonce = (uid: string) => {
  const nonce = generators.nonce(); // Generate nonce
  const state = `${uid}|${generators.state()}`; // Generate state

  return { nonce, state };
};

const getClaimsFromIdToken = (idToken: string): object => {
  const decodedClaims = Buffer.from(idToken.split('.')[1], 'base64').toString('utf8');
  const claims = JSON.parse(decodedClaims);
  return claims;
};
