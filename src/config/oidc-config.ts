import { Configuration, KoaContextWithOIDC } from 'oidc-provider';
import { getInteractionPolicy } from '../helpers/interaction-policy.js';
import { getProviderClients } from '../helpers/provider-clients.js';
import { findAccount } from '../service/account.service.js';
import { renderError } from '../helpers/render-error.js';
import { Logger } from '../utils/winston.js';
import { findDemoAccount } from '../service/demo-account.service.js';
import { jwkPrivate } from '../helpers/keystore.js';
import { ttlHandler } from './handlers/ttl.handler.js';
import { MongoAdapter } from '../database/mongoose.adapter.js';

const logger = new Logger('ProviderService');

const jwks = {
  keys: [jwkPrivate]
};

export const oidcConfig: Configuration = {
  clients: getProviderClients(),
  findAccount: (ctx: KoaContextWithOIDC, id: string) => {
    if (id.split('|')[0] === 'demo') {
      return findDemoAccount(ctx, id);
    }

    return findAccount(ctx, id);
  },
  adapter: MongoAdapter,
  renderError,
  ttl: ttlHandler(),
  interactions: {
    url(ctx: KoaContextWithOIDC, interaction: any) {
      // cannot import Interaction that is why I am using any
      // eslint-disable-line no-unused-vars

      return `/interaction/${interaction.uid}`;
    },
    policy: getInteractionPolicy()
  },
  cookies: {
    keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more']
  },
  claims: {
    // address: ['address'],
    email: ['email', 'email_verified'],
    profile: [
      // 'birthdate',
      'family_name',
      'gender',
      'given_name',
      'locale'
      // 'middle_name',
      // 'name',
      // 'nickname',
      // 'picture',
      // 'preferred_username',
      // 'profile',
      // 'updated_at',
      // 'website',
      // 'zoneinfo'
    ]
  },
  clientBasedCORS: (ctx: KoaContextWithOIDC, origin: string) => {
    // eslint-disable-line no-unused-vars
    return true;
  },
  features: {
    devInteractions: { enabled: false }, // defaults to true
    clientCredentials: { enabled: true },
    jwtResponseModes: { enabled: true },
    // userinfo: {
    //   enabled: true
    // },
    deviceFlow: { enabled: true }, // defaults to false
    // revocation: { enabled: true }, // defaults to false
    resourceIndicators: {
      enabled: true,
      defaultResource: (ctx: KoaContextWithOIDC) => {
        return 'https://xauth.test';
      },
      getResourceServerInfo: (ctx, resourceIndicator, client) => {
        logger.debug('get resource server info', client);

        return {
          scope: 'openid api:read api:write',
          audience: resourceIndicator,
          accessTokenFormat: 'jwt'
        };
      },
      useGrantedResource: (ctx, model) => {
        // @param ctx - koa request context
        // @param model - depending on the request's grant_type this can be either an AuthorizationCode, BackchannelAuthenticationRequest,
        //                RefreshToken, or DeviceCode model instance.

        return true;
      }
    }
  },
  jwks
};
