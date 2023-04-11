import express from "express";
import Provider from "oidc-provider";
import { oidcConfig } from "./config/oidc-config.js";
import { serverConfig } from "./config/server-config.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const provider = new Provider(serverConfig.oidc.issuer, oidcConfig).callback();
app.use(provider);

const server = app.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
});
