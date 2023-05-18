#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as config from "../lib/config";
import { ExplorerTools } from "../lib/stacks/ec2";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

// const vpcStack = new VpcXauth(app, `vpc-xauth`);

const tamdyo = new ExplorerTools(app, `tamdyo`, {
  env,
  name: `xauth`,
  zone: config.zone,
  sshKeyName: "djuro-ssh",
  vpcId: config.explorer.vpc.vpcId!,
});
