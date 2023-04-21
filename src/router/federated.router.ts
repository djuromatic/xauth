/* eslint-disable no-console, camelcase, no-unused-vars */
import assert from "node:assert";

import { NextFunction, Request, Response, urlencoded, Express } from "express"; // eslint-disable-line import/no-unresolved
import Provider, { InteractionResults } from "oidc-provider";
import { serverConfig } from "../config/server-config.js";

export default (app: Express, provider: Provider) => {
  function setNoCache(req: Request, res: Response, next: NextFunction) {
    res.set("cache-control", "no-store");
    next();
  }

  app.post("/interaction/:uid/federated", async (req, res) => {
    const {
      prompt: { name },
      params: { client_id },
      session,
    } = await provider.interactionDetails(req, res);
    assert.equal(name, "login");
    const path = `/interaction/${req.params.uid}/federated`;
    const { upstream } = req.body;

    switch (upstream) {
      case "google": {
        // const callbackParams = req.google.callbackParams(req) as any;

        const requestParams = {
          client_id: serverConfig.google.clientID,
          // client_secret: client.clientSecret,
          redirect_uri:
            "https://6e12-109-198-9-3.ngrok-free.app/interaction/callback/google",
          scope: "openid email profile",
          response_type: "code",
          state: "state",
        };

        const authUrl = new URL(
          "https://accounts.google.com/o/oauth2/auth/oauthchooseaccount"
        );
        authUrl.search = new URLSearchParams(requestParams).toString();

        console.log(authUrl.toString());

        return res.redirect(authUrl.toString());
      }

      default:
        return undefined;
    }
  });

  app.get(
    "/interaction/callback/google",
    async (req: Request, res: Response) => {
      const nonce = res.locals.cspNonce;
      return res.render("repost", {
        layout: false,
        title: "googlease",
        upstream: "google",

        nonce: "321312",
      });
    }
  );
};
