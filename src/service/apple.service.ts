import { Issuer, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';
import { Request } from 'express';
import { UnauthorizedException } from '../common/errors/exceptions.js';
import SsoLogin from '../models/login.js';

const logger = new Logger('AppleService');

export type AppleLogin = {
  uid: string;
  nonce: string;
  state: string;
  code_challenge: string;
};

export const login = async (login: AppleLogin): Promise<string> => {
  const { apple } = serverConfig;
  const { uid, nonce, state, code_challenge } = login;

  const issuer = await Issuer.discover(apple.issuerUrl);
  const client = new issuer.Client({
    client_id: apple.clientID,
    redirect_uris: [apple.redirectUri]
  });

  const authOptions = {
    grant_type: 'authorization_code',
    scope: 'name email',
    response_mode: 'form_post',
    // nonce,
    state,
    // code_challenge,
    // code_challenge_method: 'S256',
    token_endpoint_auth_method: 'none'
  };

  const url = client.authorizationUrl(authOptions);
  logger.debug(url);
  return url;
};

export const callback = async (req: Request) => {
  try {
    const { apple } = serverConfig;

    const issuer = await Issuer.discover(apple.issuerUrl);
    const client = new issuer.Client({
      client_id: apple.clientID,
      client_secret: apple.clientSecret,
      scope: 'name email',
      redirect_uris: [apple.redirectUri],
      response_types: ['code id_token'],
      id_token_signed_response_alg: 'RS256'
    });

    console.log(req.body);

    const params = client.callbackParams(req);
    const { code_verifier, nonce, state } = await SsoLogin.findOne({ uid: params.state.split('|')[0] });
    const tokenSet = await client.callback(apple.redirectUri, params, { state });

    console.log(tokenSet);
  } catch (error) {
    logger.error(error);
  }
};

export const generateStateAndNonce = (uid: string) => {
  const nonce = generators.nonce(); // Generate nonce
  const state = `${uid}|${generators.state()}`; // Generate state

  return { nonce, state };
};
