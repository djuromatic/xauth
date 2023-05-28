import express from 'express';
import Provider, { KoaContextWithOIDC } from 'oidc-provider';
import { oidcConfig } from './config/oidc/oidc-config.js';
import { serverConfig } from './config/server-config.js';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import fileDirName from './helpers/file-dir-name.js';
import interactionRouter from './router/interaction.router.js';
import emailPasswordRouter from './router/email-password.router.js';
import { createConnection } from './database/mongoose.adapter.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { Logger } from './utils/winston.js';
import federatedRouter from './router/federated.router.js';
import forgotenPasswordRouter from './router/forgot-password.router.js';
import metamaskRouter from './router/metamask.router.js';
import demoRouter from './router/demo.router.js';
import { interactionErrorHandler } from './common/errors/interaction-error-handler.js';

const { port } = serverConfig;

export const createServer = async () => {
  const logger = new Logger('Init');

  const app = express();
  app.get('/health', (req, res) => {
    res.send('OK');
  });

  const { __dirname } = fileDirName(import.meta);

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(express.json());
  app.use('/static/js', express.static(path.join(__dirname, 'views/js')));
  logger.debug(`Issuer: ${serverConfig.oidc.issuer}`);
  const provider = new Provider(serverConfig.oidc.issuer, oidcConfig);

  if (process.env.NODE_ENV !== 'local') {
    provider.proxy = true;
  }

  app.use(loggerMiddleware);

  const oidc = provider.callback();

  provider.on('server_error', function (ctx, error) {
    debuggLog('server_error', ctx, error);
  });

  provider.on('authorization.error', function (ctx, error) {
    debuggLog('authorization.error', ctx, error);
  });

  provider.on('grant.error', function (ctx, error) {
    debuggLog('grant.error', ctx, error);
  });

  interactionRouter(app, provider);
  emailPasswordRouter(app, provider);
  federatedRouter(app, provider);
  forgotenPasswordRouter(app, provider);
  metamaskRouter(app, provider);
  demoRouter(app, provider);

  interactionErrorHandler(app, provider);

  app.use(oidc);

  let server;
  if (process.env.NODE_ENV === 'local') {
    server = https.createServer(
      {
        key: fs.readFileSync(path.join(__dirname, 'certs/xauth/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/xauth/cert.pem'))
      },
      app
    );
  } else {
    server = http.createServer(app);
  }

  server.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  createConnection(serverConfig);

  function debuggLog(message: string, ctx: KoaContextWithOIDC, error: Error) {
    logger.debug(`${message} [CONTEXT] ${JSON.stringify(ctx, null, 4)}`);
    logger.debug(`${message} [ERROR] ${JSON.stringify(error, null, 4)}`);
  }
};
