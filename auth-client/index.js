#!/usr/bin/env node
const { parse } = require('qs');
/* eslint-disable no-console, camelcase */
const { readFileSync } = require('fs');
const config = require('./config.json');

const args = process.argv.slice(2);
if (args.length) {
  console.log(args);

  if (args[0] === '--org') {
    config.organization_login = true;
    config.organizationId = args[1] ?? config.organizationId ?? '';
  }
}

const server = require('https')
  .createServer({
    cert: readFileSync('./xauth.test.pem'),
    key: readFileSync('./xauth.test-key.pem'),
  })
  .listen(config.port);

const { Issuer, generators } = require('openid-client');
const open = require('open');

server.removeAllListeners('request');
const { ISSUER = config.issuer } = process.env;

server.once('listening', () => {
  (async () => {
    const issuer = await Issuer.discover(ISSUER);

    // const { address, port } = server.address();
    // const hostname = address === '::' ? '[::1]' : address;

    const client = new issuer.Client({
      client_id: config.client_id,
      redirect_uri: `https://${config.hostname}:${config.port}`,
      token_endpoint_auth_method: 'none',
    });
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const redirect_uri = `https://${config.hostname}:${config.port}`;

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close');
      const params = client.callbackParams(req);
      if (Object.keys(params).length) {
        const tokenSet = await client.callback(redirect_uri, params, {
          code_verifier,
          response_type: 'code',
        });

        console.log('got', tokenSet);
        console.log('id token claims', tokenSet.claims());

        const userinfo = await client.userinfo(tokenSet);
        console.log('userinfo', userinfo);

        res.end('you can close this now');
        server.close();
      }
    });

    const invitation = config.invitation ?? '';

    let authConfig = {
      audience: config.audiance,
      redirect_uri,
      code_challenge,
      code_challenge_method: 'S256',
      token_endpoint_auth_method: 'none',
      scope: 'openid profile email',
    };

    if (invitation.length > 0) {
      authConfig = { ...authConfig, ...parse(invitation) };
    }

    if (config.organization_login) {
      authConfig.organization = config.organizationId;
    }

    await open(client.authorizationUrl(authConfig), { wait: false });
  })().catch((err) => {
    console.error(err);
    process.exitCode = 1;
    server.close();
  });
});
