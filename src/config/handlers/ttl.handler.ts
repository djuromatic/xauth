import { serverConfig } from '../server-config.js';

export const ttlHandler = () => {
  return {
    AccessToken: (client: any, ctx: any) => {
      const { accountId } = ctx;

      if (isDemo(accountId)) {
        // 5 minutes
        return serverConfig.users.demo.access_token_ttl;
      }

      // 1 hour
      return serverConfig.users.regular.access_token_ttl;
    },
    AuthorizationCode: 60 * 10, // 10 minutes in seconds
    IdToken: 60 * 60, // 1 hour in seconds
    DeviceCode: 60 * 10, // 10 minutes in seconds
    RefreshToken: 60 * 60 * 24 * 30, // 30 days in seconds
    Session: (client: any, ctx: any) => {
      if (isDemo(ctx.accountId)) {
        return serverConfig.users.demo.session_ttl;
      } else return serverConfig.users.regular.session_ttl;
    },
    Grant: 5 * 60 * 60 * 30 // 30 days in seconds
  };
};

const isDemo = (accountId: string) => {
  return accountId.split('|')[0] === 'demo';
};
