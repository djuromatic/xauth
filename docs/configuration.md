# XAuth - Configuration

Our project uses an extensive set of configuration options that allow you to tailor the service to your specific needs. Below is a comprehensive guide to configuring the project.

All these settings are managed in the `serverConfig` object. Let's walk through each section of this configuration.

## Server Configuration

### Node Environment

- `node_env`: This refers to your Node.js environment variable. It can be `development`, `production` etc.

`default: local` - requires ssl certificates

### Service Name

- `serviceName`: The name of your service.

### Hostname

- `hostname`: The hostname where your service will be available.

### Port

- `port`: The port your service will listen to.

## Database Configuration

This section defines the settings for your database connection.

- `host`: The hostname of your database server.
- `port`: The port your database server is listening on.
- `dbName`: The name of your database.
- `dbUser`: The username to connect to your database.
- `dbPass`: The password to connect to your database.

## OIDC Configuration

This section configures your OpenID Connect settings.

- `issuer`: The issuer URL for your OIDC configuration.
- `defaultResourceServer`: The default Resource Server for your OIDC configuration.
- `clients`: An array of clients for your OIDC configuration. Each client has its settings, such as `client_id`, `client_secret`, `grant_types`, `scope`, `redirect_uris`, `response_types`, and `token_endpoint_auth_method`.

## Logger Configuration

- `level`: The level of logging you want to display (`debug`, `info`, `warn`, `error`).

## Google Configuration

This section configures the settings for Google login.

- `clientID`: The client ID for your Google application.
- `clientSecret`: The client secret for your Google application.
- `redirectUri`: The URI where Google will redirect the user after authorization.
- `issuerUrl`: The issuer URL for Google.

## Apple Configuration

This section configures the settings for Apple login.

- `clientID`: The client ID for your Apple application.
- `clientSecret`: The client secret for your Apple application.
- `redirectUri`: The URI where Apple will redirect the user after authorization.
- `issuerUrl`: The issuer URL for Apple.

## AWS Configuration

This section defines the settings for AWS.

- `profile`: Your AWS profile.
- `region`: Your AWS region.
- `ses`: The settings for AWS SES, including `role_arn`, `email_from`, `source_arn`, and `web_identity_token_file`.

## User Configuration

This section defines the settings for user sessions.

- `demo`: Configuration for demo users, including `access_token_ttl` and `session_ttl`.
- `regular`: Configuration for regular users, including `access_token_ttl` and `session_ttl`.

Remember to replace default values with your specific settings, and never expose sensitive information like database passwords or client secrets in your code or version control system. Always retrieve sensitive information through secure methods like environment variables.
