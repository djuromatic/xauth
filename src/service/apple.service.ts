import { Client, Issuer, generators } from 'openid-client';
import { serverConfig } from '../config/server-config.js';
import { Logger } from '../utils/winston.js';

export class AppleService {
  private readonly logger = new Logger('AppleService');
  private config: any;

  constructor({ apple } = serverConfig) {
    this.config = apple;
  }

  public login = async () => {
    if (!client) {
      throw new Error('Client not initialized');
    }
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
    this.logger.debug(url);
    return url;
  };
}
