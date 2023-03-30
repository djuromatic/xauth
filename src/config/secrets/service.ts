import { ISecrets } from "./interface";

class Secrets implements ISecrets {
  private static instance: Secrets;

  mongo = {
    host: process.env.HOST || "localhost",
    port: +process.env.PORT || 27017,
    username: process.env.DB_USER || "xauth",
    password: process.env.DB_PASS || "xauth",
    db_name: process.env.DB_NAME || "xauth",
  };

  private constructor() {}

  static getInstance(): Secrets {
    if (!Secrets.instance) {
      Secrets.instance = new Secrets();
    }
    return Secrets.instance;
  }
}

export const secrets = Secrets.getInstance();
