import * as dotenv from 'dotenv';
import { createServer } from './server.js';
import { SesService } from './utils/aws/ses.js';
const init = async () => {
  await dotenv.config();
};

await init();
await createServer();

const email = new SesService();
email.sendTextEmail(['djuro.matic@mvpworkshop.co', 'djuromatic991@gmail.com'], 'Test', 'Test');
