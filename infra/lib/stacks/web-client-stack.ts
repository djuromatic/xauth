import { S3Frontend } from '../constructs/s3-frontend';
import * as cdk from 'aws-cdk-lib';
import { appConfig, zone } from '../config/app.config';

export class S3ReactStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const { envName, name, git } = appConfig;
    const frontendBucket = new S3Frontend(this, `appConfig Frontend Bucket`, {
      envName,
      bucketName: `${envName}-${name}-frontend`.toLowerCase(),
      zoneName: zone.zoneName,
      zone: zone,
      repoName: git.repository,
      repoOwner: git.owner,
      repoBranch: git.branch,
      gitTokenSecretPath: git.token,
      account: this.account
    });
  }
}
