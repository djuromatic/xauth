import express from "express";
import Provider from "oidc-provider";
import { oidcConfig } from "./config/oidc-config.js";
import { serverConfig } from "./config/server-config.js";
import https from "https";
import fs from "fs";
import path from "path";
import fileDirName from "./helpers/file-dir-name.js";
import interactionRouter from "./router/interaction.router.js";
import { createConnection } from "./database/mongoose.adapter.js";
import { loggerMiddleware } from "./middlewares/logger.js";

const app = express();

const { __dirname } = fileDirName(import.meta);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
const provider = new Provider(serverConfig.oidc.issuer, oidcConfig);

interactionRouter(app, provider);

app.use(loggerMiddleware);
const oidc = provider.callback();
app.use(oidc);

const server = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "certs/xauth/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certs/xauth/cert.pem")),
  },
  app
);

server.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
});

createConnection(serverConfig);
