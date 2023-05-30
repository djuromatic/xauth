import { ClientMetadata } from 'oidc-provider';

const serverConfig: ServerConfig = {
  node_env: process.env.NODE_ENV,
  serviceName: process.env.SERVICE_NAME ?? 'xauth',
  hostname: process.env.HOSTNAME ?? 'xauth.test',
  port: +process.env.PORT ?? 3000,
  startAdmins: process.env.START_ADMINS?.split(',') ?? [''],
  database: {
    connectionString: process.env.DB_CONNECTION_STRING ?? 'localhost:27017/xauth',
    dbUser: process.env.DB_USER ?? 'xauth',
    dbPass: process.env.DB_PASS ?? 'xauth',
    tlsPath: process.env.DB_TLS_PATH ?? ''
  },
  oidc: {
    issuer: process.env.OIDC_ISSUER ?? 'https://xauth.test:3000',
    defaultResourceServer: process.env.OIDC_DEFAULT_RESOURCE_SERVER ?? 'https://xauth.test:3000',
    clients: [
      {
        client_id: process.env.OIDC_CLIENT_ID ?? 'xauth',
        client_secret: process.env.client_secret ?? 'xauth',
        grant_types: process.env.OIDC_GRANT_TYPES?.split(',') ?? ['authorization_code'],
        scope: process.env.OIDC_SCOPE ?? 'openid profile email',
        redirect_uris: process.env.OIDC_REDIRECT_URIS?.split(',') ?? ['https://xauth.test:6001'],
        response_types: (process.env.OIDC_RESPONSE_TYPES?.split(',') as any) ?? ['code'],
        token_endpoint_auth_method: 'none'
      }
    ]
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
    profile: process.env.AWS_PROFILE ?? 'xauth',
    region: process.env.AWS_REGION ?? 'eu-central-1',
    ses: {
      email_from: process.env.AWS_SES_EMAIL_FROM ?? '',
      source_arn: process.env.AWS_SES_SOURCE_ARN ?? ''
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
  },
  defaultAccountRoles: process.env.DEFAULT_ACCOUNT_ROLES?.split(',') ?? ['member']
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
  startAdmins: string[];
  database: {
    connectionString: string;
    dbUser: string;
    dbPass: string;
    tlsPath: string;
  };
  oidc: {
    issuer: string;
    defaultResourceServer: string;
    clients: ClientMetadata[];
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
      email_from: string;
      source_arn: string;
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

  defaultAccountRoles: string[];
}

export { serverConfig };
