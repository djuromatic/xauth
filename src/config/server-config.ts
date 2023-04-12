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
}

export { serverConfig };
