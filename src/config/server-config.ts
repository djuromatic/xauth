const serverConfig: ServerConfig = {
  node_env: process.env.NODE_ENV ?? 'local',
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
    issuer: process.env.OIDC_ISSUER ?? 'https://xauth.test:3000'
  },
  logger: {
    level: process.env.LOGGER_LEVEL ?? 'debug'
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? `https://xauth.test:3000/interaction/callback/google`,
    issuerUrl: process.env.GOOGLE_ISSUER_URL ?? 'https://accounts.google.com'
  },
  aws: {
    profile: process.env.AWS_PROFILE ?? 'mvp-studio',
    region: process.env.AWS_REGION ?? 'us-east-1',
    ses: {
      role_arn: process.env.AWS_SES_ROLE_ARN ?? '',
      email_from: process.env.AWS_SES_EMAIL_FROM ?? '',
      source_arn: process.env.AWS_SES_SOURCE_ARN ?? '',
      web_identity_token_file: process.env.AWS_SES_WEB_IDENTITY_TOKEN_FILE ?? ''
    }
  },
  users: {
    demo: {
      access_token_ttl: process.env.DEMO_ACCESS_TOKEN_TTL ? +process.env.DEMO_ACCESS_TOKEN_TTL : 300,
      session_ttl: process.env.DEMO_SESSION_TTL ? +process.env.DEMO_SESSION_TTL : 300
    },
    regular: {
      access_token_ttl: process.env.REGULAR_ACCESS_TOKEN_TTL ? +process.env.REGULAR_ACCESS_TOKEN_TTL : 3600,
      session_ttl: process.env.REGULAR_SESSION_TTL ? +process.env.REGULAR_SESSION_TTL : 3600
    }
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID ?? '',
    clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
    redirectUri: process.env.APPLE_REDIRECT_URI ?? `https://xauth.test:3000/interaction/callback/apple`,
    issuerUrl: process.env.APPLE_ISSUER_URL ?? 'https://appleid.apple.com'
  }
};

export interface FederatedLoginConfig {
  clientID: string;
  clientSecret: string;
  redirectUri: string;
  issuerUrl: string;
}

//interface ServerConfig
export interface ServerConfig {
  node_env: string;
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
  google: FederatedLoginConfig;
  apple: FederatedLoginConfig;
  aws: {
    profile: string;
    region: string;
    ses: {
      role_arn: string;
      email_from: string;
      source_arn: string;
      web_identity_token_file: string;
    };
  };
  users: {
    demo: {
      access_token_ttl: number;
      session_ttl: number;
    };
    regular: {
      access_token_ttl: number;
      session_ttl?: number;
    };
  };
}

export { serverConfig };
