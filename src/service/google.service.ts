import Provider from 'oidc-provider';
import { Request, Response } from 'express';
import { ProviderName } from '../common/enums/provider.js';
import { serverConfig } from '../config/server-config.js';
import { findByFederated, createFederatedAccount } from './account.service.js';
import crypto from 'crypto';
import { UnauthorizedException } from '../common/errors/exceptions.js';
import { Logger } from '../utils/winston.js';
import axios from 'axios';
import { AccountDocument } from '../models/account.js';
import { google } from 'googleapis';
import { NOT_VALID_USERNAME } from '../helpers/constants.js';

const OAuth2 = google.auth.OAuth2;

export type RequestParams = {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
};

export class GoogleService {
  private readonly logger = new Logger('GoogleService');
  private readonly client;

  constructor(private readonly req: Request, private readonly res: Response, private readonly provider: Provider) {
    this.client = new OAuth2(
      serverConfig.google.clientID,
      serverConfig.google.clientSecret,
      serverConfig.google.redirectUri
    );
  }

  public async login(): Promise<void> {
    // check for identity token in callback params
    const userNotExistRedirectLoginUrl = this.chechForId();
    if (userNotExistRedirectLoginUrl) {
      return this.res.redirect(userNotExistRedirectLoginUrl);
    }

    //decode id_token
    const claims = this.getClaimsFromIdToken();
    let account = await findByFederated(ProviderName.GOOGLE, claims.sub);

    if (!account) {
      account = await this.createNewUser(claims);
    }

    if (account.profile.username === NOT_VALID_USERNAME) {
      const { uid, prompt, params, session } = await this.provider.interactionDetails(this.req, this.res);

      const client = await this.provider.Client.find(params.client_id as any);

      return this.res.render('finish-registration', {
        client,
        uid,
        sub: account.profile.sub,
        details: prompt.details,
        params,
        title: 'Finish registration',
        session: session ?? undefined,
        dbg: {
          params: {},
          prompt: {}
        }
      });
    }

    const result = {
      login: {
        accountId: account.accountId
      }
    };
    return this.provider.interactionFinished(this.req, this.res, result, {
      mergeWithLastSubmission: false
    });
  }

  public async requestWithBearerToken(accessToken: string, url: string) {
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
      this.logger.error(error);
      throw new UnauthorizedException("Can't get user info");
    }
  }

  private chechForId(): string | null {
    if (!this.req.body.id_token) {
      const state = `${this.req.params.uid}|${crypto.randomBytes(32).toString('hex')}`;
      const nonce = crypto.randomBytes(32).toString('hex');

      this.res.status(303);

      const requestParams = {
        client_id: serverConfig.google.clientID,
        redirect_uri: serverConfig.google.redirectUri,
        scope: 'openid email profile',
        response_type: 'id_token token',
        state,
        nonce
      };

      return this.redirectAuthorizeUrl(requestParams) ?? null;
    }
  }

  private getClaimsFromIdToken() {
    const idToken = this.req.body.id_token;
    const decodedClaims = Buffer.from(idToken.split('.')[1], 'base64').toString('utf8');
    const claims = JSON.parse(decodedClaims);
    return claims;
  }

  private async createNewUser(claims: any): Promise<AccountDocument> {
    const userInfo = await this.requestWithBearerToken(
      this.req.body.access_token,
      'https://www.googleapis.com/oauth2/v3/userinfo'
    );
    const accountId = `${ProviderName.GOOGLE}|${claims.sub}`;
    const profile = {
      username: NOT_VALID_USERNAME,
      ...claims,
      ...userInfo,
      sub: accountId
    };
    const result = await createFederatedAccount(accountId, profile);
    return result;
  }

  private redirectAuthorizeUrl(requestParams: RequestParams): string {
    const authUrl = this.client.generateAuthUrl({
      ...requestParams
    });

    this.logger.debug('auth_url', { authUrl });
    return authUrl;
  }
}
