// getting-started.js
import mongoose from "mongoose";
import { ISecrets } from "../config/";

export async function createConnection(secrets: ISecrets) {
  const { username, password, host, port, db_name } = secrets.mongo;

  await mongoose.connect(
    `mongodb://${username}:${password}@${host}:${port}/${db_name}`
  );
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
