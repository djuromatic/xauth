export const ttlHandler = () => {
  return {
    AccessToken: (client: any, ctx: any) => {
      const { accountId } = ctx;

      const isDemo = accountId.split('|')[0] === 'demo';

      if (isDemo) {
        // 5 minutes
        return 300;
      }

      // 1 hour
      return 60 * 60;
    },
    AuthorizationCode: 60 * 10, // 10 minutes in seconds
    IdToken: (client: any, ctx: any) => {
      const { accountId } = ctx;

      const isDemo = accountId.split('|')[0] === 'demo';

      if (isDemo) {
        // 5 minutes
        return 300;
      }

      // 1 hour
      return 60 * 60;
    },
    DeviceCode: 60 * 10, // 10 minutes in seconds
    RefreshToken: 60 * 60 * 24 * 30, // 30 days in seconds
    Session: 60 * 60 * 24 * 7, // 7 days in seconds
    Interaction: 60 * 60 * 24, // 1 day in seconds
    Grant: 60 * 60 * 24 * 30 // 30 days in seconds
  };
};
