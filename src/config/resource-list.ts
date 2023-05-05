// Define list of resources server
let resourcesList: any = {};

// Register api 1 on the IdProvider
// Assume process.env.API1_BASE_URL = https://api1.example.com
resourcesList['https://xauth.test'] = {
  // These scope is accept the by the resource server to make authorization decisions
  scope: 'offline_access api:query api:get api:post api:patch api:delete',

  // Audience
  audience: 'https://xauth.test',

  // accessTokenFormat?: 'opaque' | 'jwt' | 'paseto'
  // Please see https://github.com/panva/node-oidc-provider/tree/main/docs#getresourceserverinfo sections Resource Server (API) for more customization
  accessTokenFormat: 'jwt'
};
