import { Express, Router } from "express";
import { PassportStatic } from "passport";
import { getUserProfile } from "../../controllers";

const configureProfileRouter = (app: Express, passport: PassportStatic) => {
  const router = Router();

  router.get(
    "/profile",
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      const user = await getUserProfile("djuromatic@gmail.com");

      res.json({
        message: "You made it to the secure route",
        user: user,
        token: req.query.secret_token,
      });
    }
  );

  app.use(router);
};

export { configureProfileRouter };
