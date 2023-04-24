import * as dotenv from 'dotenv';
import { createServer } from './server.js';
const init = async () => {
  await dotenv.config();
};

await init();
await createServer();
