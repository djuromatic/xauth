import { ClientMetadata } from "oidc-provider";

function getProviderClients(): ClientMetadata[] {
  return [
    {
      client_id: "xauth",
      client_secret: "xauth",
      grant_types: ["authorization_code"],
      redirect_uris: ["http://localhost:3000/"],
      response_types: ["code"],
    },
  ];
}

export { getProviderClients };
