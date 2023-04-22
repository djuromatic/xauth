const serverConfig: ServerConfig = {
  serviceName: process.env.SERVICE_NAME ?? 'xauth',
  hostname: process.env.HOSTNAME ?? 'xauth.test',
  port: +process.env.PORT ?? 3000,
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: +process.env.DB_PORT ?? 27017,
    dbName: process.env.DB_NAME ?? 'xauth',
    dbUser: process.env.DB_USER ?? 'xauth',
    dbPass: process.env.DB_PASS ?? 'xauth'
  },
  oidc: {
    issuer: process.env.OIDC_ISSUER ?? 'http://xauth.test:3000'
  },
  logger: {
    level: process.env.LOGGER_LEVEL ?? 'debug'
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? `https://xauth.test:3000/interaction/callback/google`
  }
};

//interface ServerConfig
export interface ServerConfig {
  serviceName: string;
  hostname: string;
  port: number;
  database: {
    host: string;
    port: number;
    dbName: string;
    dbUser: string;
    dbPass: string;
  };
  oidc: {
    issuer: string;
  };
  logger: {
    level: string;
  };
  google: {
    clientID: string;
    clientSecret: string;
    redirectUri: string;
  };
}

export { serverConfig };
