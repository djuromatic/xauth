#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as config from '../lib/config';
import { appConfig, zone } from '../lib/config/app.config';
import { ExplorerTools } from '../lib/stacks/ec2';
import { DocumentDBStack } from '../lib/stacks/documentdb-stack';
import { EcsStack } from '../lib/stacks/ecs-stack';
import { S3ReactStack } from '../lib/stacks/web-client-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new cdk.App();

const secrets = new SecretsStack(app, `xmanna-secrets`, {
  env
});

const { googleClientSecret, appleClientSecret, oidcClientSecret, mongodbSecret } = secrets;

const a = secrets.googleClientSecret;

const xauth = new EcsStack(app, `xmanna-xauth`, {
  env,
  secrets
});
xauth.addDependency(secrets);

// const reactApp = new S3ReactStack(app, `xmanna-react`, {
//   env
// });

// const vpcStack = new VpcXauth(app, `xmanna-vpc`);

// const jumpbox = new ExplorerTools(app, `xmanna-jumpbox`, {
//   env,
//   name: `xauth`,
//   zone: zone,
//   sshKeyName: 'djuro-ssh',
//   vpcId: appConfig.vpc.vpcId!
// });
