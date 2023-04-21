import { ClientMetadata } from "oidc-provider";
import { serverConfig } from "../config/server-config.js";

function getProviderClients(): ClientMetadata[] {
  return [
    {
      client_id: "xauth",
      client_secret: "xauth",
      // grant_types: ["authorization_code"],
      grant_types: [
        "refresh_token",
        "authorization_code",
        "client_credentials",
      ],

      redirect_uris: ["https://xauth.test:6001"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    // {
    //   client_id: serverConfig.google.clientID,
    //   client_secret: serverConfig.google.clientSecret,
    //   grant_types: ["authorization_code"],
    //   scope: "openid profile email",
    //   redirect_uris: [...serverConfig.google.callbackURL],
    //   response_types: ["code"],
    //   token_endpoint_auth_method: "none",
    // },
  ];
}

export { getProviderClients };
