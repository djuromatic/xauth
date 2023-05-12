const { readFileSync } = require('fs');
const config = require('./config.json');
const { parseISO, isPast } = require('date-fns');

function isTokenExpired(token) {
  const expirationDate = parseISO(new Date(token.expires_at * 1000).toISOString());
  console.log('now', parseISO(new Date().toISOString()));
  console.log('when issued', parseISO(new Date(token.claims().iat * 1000).toISOString()));
  console.log('expirationDate', expirationDate);
  return isPast(expirationDate);
}
// const args = process.argv.slice(2);

const server = require('https')
  .createServer({
    cert: readFileSync('./xauth.test.pem'),
    key: readFileSync('./xauth.test-key.pem')
  })
  .listen(config.port);

const { Issuer, generators } = require('openid-client');
const open = require('open');

server.removeAllListeners('request');
const { ISSUER = config.issuer } = process.env;

server.once('listening', () => {
  (async () => {
    const issuer = await Issuer.discover(ISSUER);

    const client = new issuer.Client({
      client_id: config.client_id,
      redirect_uri: `https://${config.hostname}:${config.port}`,
      token_endpoint_auth_method: 'none'
    });
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const redirect_uri = `https://${config.hostname}:${config.port}`;

    server.on('request', async (req, res) => {
      res.setHeader('connection', 'close');
      const params = client.callbackParams(req);
      console.log({ params });
      if (Object.keys(params).length) {
        const tokenSet = await client.callback(redirect_uri, params, {
          code_verifier,
          response_type: 'code'
        });

        console.log('got', tokenSet);
        console.log('id token claims', tokenSet.claims());

        console.log('isExpired', isTokenExpired(tokenSet));

        res.end('You can close this screen now...');
        server.close();
      }
    });

    let authConfig = {
      audience: config.audiance,
      redirect_uri,
      code_challenge,
      code_challenge_method: 'S256',
      token_endpoint_auth_method: 'none',
      scope: 'openid'
    };

    await open(client.authorizationUrl(authConfig), { wait: false });
  })().catch((err) => {
    console.error(err);
    process.exitCode = 1;
    server.close();
  });
});
