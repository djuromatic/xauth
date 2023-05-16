import { Issuer, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';
import { Request } from 'express';
import SsoLogin from '../models/login.js';
import { createFederatedAccount, findByFederated } from './account.service.js';
import { ProviderName } from '../common/enums/provider.js';
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
    const { user, upstream, id_token } = req.body;
    let account;

    // apple send user only first time
    if (user) {
      //parse the user object from the request
      const removeHtmlEntities = user.replace(/&#34;/g, '"');
      //parse user string to object
      const parsedUser = JSON.parse(removeHtmlEntities);

      //create the user object
      const userObj = {
        given_name: parsedUser.name.firstName,
        family_name: parsedUser.name.lastName,
        email: parsedUser.email
      };
      //get the openid client
      const issuer = await Issuer.discover(apple.issuerUrl);
      const client = new issuer.Client({
        client_id: apple.clientID,
        client_secret: apple.clientSecret,
        scope: 'name email',
        redirect_uris: [apple.redirectUri],
        response_types: ['id_token'],
        id_token_signed_response_alg: 'RS256'
      });

      //parse the callback params from the request
      const params = client.callbackParams(req);
      //get the stored login request
      const { code_verifier, nonce, state } = await SsoLogin.findOne({ uid: params.state.split('|')[0] });
      //exchange the code for the token
      const tokenSet = await client.callback(apple.redirectUri, params, { state, nonce, code_verifier });

      //sub is the unique identifier for the user
      const aId = `${upstream}|${tokenSet.claims().sub}`;

      //merge the claims from the id_token with the user object
      const profile = {
        ...getClaimsFromIdToken(tokenSet.id_token),
        ...userObj,
        locale: 'en',
        username: userObj.email, //TODO change this it is not part of this pr
        sub: aId
      };
      //create the account
      account = await createFederatedAccount(aId, profile);
    } else {
      //get the account
      account = await findByFederated(upstream, id_token.sub);
    }

    //return the account id
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
