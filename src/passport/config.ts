import passport from "passport";
import { Express } from "express";
import { createLocalStrategy } from "./email_password/";
// import { emailPasswordStrategy } from "./email_password/strategy";

const configurePassport = (app: Express) => {
  app.use(passport.initialize());

  createLocalStrategy(passport);

  console.log("Passport configured");
  return passport;
};

export { configurePassport };
