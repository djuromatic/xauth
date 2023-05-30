import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { SecretValue } from 'aws-cdk-lib';

export class SecretsStack extends cdk.Stack {
  private readonly _oidcClientSecret: secretsmanager.Secret;
  private readonly _googleClientSecret: secretsmanager.Secret;
  private readonly _appleClientSecret: secretsmanager.Secret;
  private readonly _mongodbSecret: secretsmanager.Secret;
  private readonly _kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // // Create a KMS Key
    // const key = new kms.Key(this, 'xauth-kms-key', {
    //   alias: 'xauth-kms-key',
    //   description: 'Key for encrypting OIDC client secrets',
    //   enableKeyRotation: true
    // });

    const mongodbSecret = {
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD
    };

    // Define the secret value - this would normally come from a secure source
    const googleClientSecret = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET
    };
    const appleClientSecret = {
      client_id: process.env.APPLE_CLIENT_ID,
      client_secret: process.env.APPLE_CLIENT_SECRET
    };

    const oidcClientSecret = {
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET
    };

    // Create a new Secret for OIDC client
    const oidcClient = new secretsmanager.Secret(this, 'OIDCClientSecret', {
      secretName: 'oidcClientSecret',
      secretStringValue: new SecretValue(JSON.stringify(oidcClientSecret))
    });

    // Create a new Secret for Google OIDC client
    const google = new secretsmanager.Secret(this, 'GoogleClientSecret', {
      secretName: 'googleClientSecret',
      secretStringValue: new SecretValue(JSON.stringify(googleClientSecret))
    });

    // Create a new Secret for Apple OIDC client
    const apple = new secretsmanager.Secret(this, 'AppleClientSecret', {
      secretName: 'appleClientSecret',
      secretStringValue: new SecretValue(JSON.stringify(appleClientSecret))
    });

    // Create a new Secret for MongoDB
    const mongo = new secretsmanager.Secret(this, 'MongoDBSecret', {
      secretName: 'mongodbSecret',
      secretStringValue: new SecretValue(JSON.stringify(mongodbSecret))
    });

    // Output the secret ARN
    new cdk.CfnOutput(this, 'googleClientSecretArn', {
      value: google.secretArn
    });
    new cdk.CfnOutput(this, 'appleClientSecretArn', {
      value: apple.secretArn
    });
    new cdk.CfnOutput(this, 'mongodbSecretArn', {
      value: mongo.secretArn
    });
    new cdk.CfnOutput(this, 'oidcClientSecretArn', {
      value: oidcClient.secretArn
    });
  }

  get oidcClientSecret(): secretsmanager.Secret {
    return this._oidcClientSecret;
  }
  get googleClientSecret(): secretsmanager.Secret {
    return this._googleClientSecret;
  }
  get appleClientSecret(): secretsmanager.Secret {
    return this._appleClientSecret;
  }
  get mongodbSecret(): secretsmanager.Secret {
    return this._mongodbSecret;
  }
  get kmsKey(): kms.Key {
    return this._kmsKey;
  }
}
