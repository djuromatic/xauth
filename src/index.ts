import express from "express";
import { createConnection } from "./database/connection";
import { configurePassport } from "./config/";

import { secrets } from "./config";

import { configureLoginRouter, configureProfileRouter } from "./api/routes/";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const passport = configurePassport(app);
configureLoginRouter(app, passport);
configureProfileRouter(app, passport);

const server = app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

createConnection(secrets)
  .then(() => console.log(`connected to database ${secrets.mongo.db_name}`))
  .catch((err) => console.error(err));
