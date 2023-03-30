import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { EmailPasswordModel } from "../../models";

import { Strategy, ExtractJwt } from "passport-jwt";

const createLocalStrategy = (passport: PassportStatic) => {
  passport.use(
    new Strategy(
      {
        secretOrKey: "TOP_SECRET",
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      async (token: any, done: Function) => {
        try {
          return done(null, token.user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.use(
    "signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await EmailPasswordModel.create({ email, password });

          return done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  // ...

  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await EmailPasswordModel.findOne({ email });

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          const validate = await user.isValidPassword(password);

          if (!validate) {
            return done(null, false, { message: "Wrong Password" });
          }
          return done(null, user, { message: "Logged in Successfully" });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

export { createLocalStrategy };
