const serverConfig = {
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

export { serverConfig };
