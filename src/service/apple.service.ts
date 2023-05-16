import { Issuer, TokenSet, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';
import { Request } from 'express';
import SsoLogin from '../models/login.js';
import { createFederatedAccount, findByFederated } from './account.service.js';
import { UnauthorizedException } from '../common/errors/exceptions.js';
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
    let account;

    //get the openid client
    const client = await getClient(apple);
    //parse the callback params from the request
    const params = client.callbackParams(req);
    //get the stored login request
    const { code_verifier, nonce, state } = await SsoLogin.findOne({ uid: params.state.split('|')[0] });
    //exchange the code for the token
    const tokenSet = await client.callback(apple.redirectUri, params, { state, nonce, code_verifier });
    //sub is the unique identifier for the user
    const sub = `${tokenSet.claims().sub}`;
    account = await findByFederated(upstream, sub);
    // apple send user only first time
    if (user && !account) {
      //parse the user object from the request
      const profile = mapUserProfile(user, tokenSet, sub);
      //create the account
      account = await createFederatedAccount(sub, profile);
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
function mapUserProfile(user: string, tokenSet: TokenSet, sub: string) {
  const removeHtmlEntities = user.replace(/&#34;/g, '"');
  //parse user string to object
  const parsedUser = JSON.parse(removeHtmlEntities);

  //create the user object
  const userObj = {
    given_name: parsedUser.name.firstName,
    family_name: parsedUser.name.lastName,
    email: parsedUser.email
  };

  //merge the claims from the id_token with the user object
  const profile = {
    ...getClaimsFromIdToken(tokenSet.id_token),
    ...userObj,
    locale: 'en',
    username: userObj.email,
    sub
  };
  return profile;
}

async function getClient(apple: {
  //parse user string to object
  clientID: string;
  clientSecret: string;
  redirectUri: string;
  issuerUrl: string; //create the user object
}) {
  const issuer = await Issuer.discover(apple.issuerUrl);
  const client = new issuer.Client({
    client_id: apple.clientID,
    client_secret: apple.clientSecret,
    scope: 'name email',
    redirect_uris: [apple.redirectUri],
    response_types: ['id_token'],
    id_token_signed_response_alg: 'RS256'
  });
  return client;
}
