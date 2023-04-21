import * as dotenv from "dotenv";
import { createServer } from "./server.js";
import { serverConfig } from "./config/server-config.js";
const init = async () => {
  await dotenv.config();
};

await init();

console.log(process.env);

console.log(serverConfig.google);

await createServer();
