# OpenId-Connect Login for Auth0

## Installation

`npm install`

## Configuration

Create a file called `config.json` in the root directory of the project. The file should contain the following:

```json
{
  "issuer": "https://example.com",
  "client_id": "fadsfsadfsafasf",
  "audiance": "https://api.example.com",
  "organizationId": "org_fdsafsafiH"
}
```

- `issuer`: The issuer of the OpenId-Connect provider. This is the URL of the Auth0 tenant.
- `client_id`: The client id of the application that is registered with the OpenId-Connect provider.
- `audiance`: The audiance of the application that is registered with the OpenId-Connect provider.
- `organizationId`: The organization id of the organization application that is registered with the OpenId-Connect provider.

## Running the application

```bash
#login with out organization
node index.js

#login with organization id setted in config.json
node index.js --org

#login with organization id from argument
node index.js --org org_1234567890
```

### when `--org` flag is set `true` organizationId is `required`. either from config.json or from argument
