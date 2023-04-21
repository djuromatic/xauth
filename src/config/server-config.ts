const serverConfig: ServerConfig = {
  serviceName: "xauth",
  port: 3000,
  database: {
    host: "localhost",
    port: 27017,
    dbName: "xauth",
    dbUser: "xauth",
    dbPass: "xauth",
  },
  oidc: {
    issuer: "http://xauth.test:3000",
  },
  logger: {
    level: "debug",
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://xauth.test:6001/interaction/callback/google",
  },
};

//interface ServerConfig
export interface ServerConfig {
  serviceName: string;
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
    callbackURL: string;
  };
}

export { serverConfig };
