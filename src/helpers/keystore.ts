import { generateKeyPairSync, createPrivateKey, createPublicKey } from 'crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
    // cipher: 'aes-256-cbc',
    // passphrase: 'fdsafsadf' // optional passphrase for encrypting the private key
  }
});

const privateKeyObject = createPrivateKey(privateKey);
const publicKeyObject = createPublicKey(publicKey);

const jwkPublic = {
  kty: 'RSA',
  e: publicKeyObject.export({ format: 'jwk' }).e,
  n: publicKeyObject.export({ format: 'jwk' }).n
};

const jwkPrivate = {
  kty: 'RSA',
  e: publicKeyObject.export({ format: 'jwk' }).e,
  n: publicKeyObject.export({ format: 'jwk' }).n,
  d: privateKeyObject.export({ format: 'jwk' }).d,
  p: privateKeyObject.export({ format: 'jwk' }).p,
  q: privateKeyObject.export({ format: 'jwk' }).q,
  dp: privateKeyObject.export({ format: 'jwk' }).dp,
  dq: privateKeyObject.export({ format: 'jwk' }).dq,
  qi: privateKeyObject.export({ format: 'jwk' }).qi
};

console.log(jwkPublic);
console.log(jwkPrivate);

export { jwkPublic, jwkPrivate };
