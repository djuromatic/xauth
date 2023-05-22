#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as config from '../lib/config';
import { ExplorerTools } from '../lib/stacks/ec2';
import { DocumentDBStack } from '../lib/stacks/documentdb-stack';
import { EcsStack } from '../lib/stacks/ecs-stack';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new cdk.App();

// const db = new DocumentDBStack(app, `tamdyo-db`, {
//   env,
//   vpcId: config.appConfig.vpc.vpcId!,
//   username: 'xauth'
// });

const xauth = new EcsStack(app, `tamdyo-xauth`, {
  env
});

// const vpcStack = new VpcXauth(app, `vpc-xauth`);

// const tamdyo = new ExplorerTools(app, `tamdyo`, {
//   env,
//   name: `xauth`,
//   zone: config.zone,
//   sshKeyName: 'djuro-ssh',
//   vpcId: config.explorer.vpc.vpcId!
// });
