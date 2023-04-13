import { NextFunction, Response, Request, Express } from "express";
import Provider, { errors } from "oidc-provider";
import { InteractionException } from "./exceptions.js";
import { debug } from "../../helpers/debug.js";

export const interactionErrorHandler = async (
  app: Express,
  provider: Provider
) => {
  const errorHandler = async (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof errors.SessionNotFound) {
      return res.redirect("/login");
    }
    if (err instanceof InteractionException) {
      const { uid, prompt, params, session } =
        await provider.interactionDetails(req, res);

      const { error_description, statusCode, message } = err;

      const client = await provider.Client.find(params.client_id as any);
      console.error(err);
      res.render("error", {
        client,
        uid,
        details: prompt.details,
        error: { error_description, statusCode, message },
        params,
        title: "Interaction Error",
        session: session ? debug(session) : undefined,
        dbg: {
          params: debug(params),
          prompt: debug(prompt),
        },
      });
    }
    next();
  };

  app.use(errorHandler);
};
