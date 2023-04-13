import { ClientMetadata } from "oidc-provider";

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
  ];
}

export { getProviderClients };
