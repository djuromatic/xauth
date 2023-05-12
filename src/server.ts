import express from 'express';
import Provider from 'oidc-provider';
import { oidcConfig } from './config/oidc-config.js';
import { serverConfig } from './config/server-config.js';
import http from 'http';
import path from 'path';
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
  console.log(serverConfig.oidc.issuer)
  const provider = new Provider(serverConfig.oidc.issuer, oidcConfig);
  provider.proxy= true

  app.use(loggerMiddleware);

  const oidc = provider.callback();

  interactionRouter(app, provider);
  emailPasswordRouter(app, provider);
  federatedRouter(app, provider);
  forgotenPasswordRouter(app, provider);
  metamaskRouter(app, provider);

  app.use(loggerMiddleware);
  demoRouter(app, provider);
  app.use(oidc);

  interactionErrorHandler(app, provider);

  const server = http.createServer(
    // {
    //   key: fs.readFileSync(path.join(__dirname, 'certs/xauth/key.pem')),
    //   cert: fs.readFileSync(path.join(__dirname, 'certs/xauth/cert.pem'))
    // },
    app
  );

  server.listen(80, () => {
    logger.info(`Server is running on port ${80}`);
  });

  createConnection(serverConfig);
};
