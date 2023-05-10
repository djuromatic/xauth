import { Issuer, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';

const logger = new Logger('AppleService');

export const login = async () => {
  const { apple } = serverConfig;

  const codeVerifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(codeVerifier);

  const issuer = await Issuer.discover(apple.issuerUrl);
  const client = new issuer.Client({
    client_id: apple.clientID,
    redirect_uris: [apple.redirectUri]
  });

  const authOptions = {
    scope: 'openid profile email',
    response_type: 'code',
    code_challenge,
    code_challenge_method: 'S256',
    token_endpoint_auth_method: 'none'
  };

  const url = client.authorizationUrl(authOptions);
  logger.debug(url);
  return url;
};
