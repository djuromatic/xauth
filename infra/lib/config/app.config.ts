import { AppConfig } from './iconfig';

export const appConfig: AppConfig = {
  name: process.env.APP_NAME || 'xauth',
  envName: process.env.ENV_NAME || 'dev',
  vpc: {
    vpcId: process.env.VPC_ID,
    cidr: ''
  },
  baseRepoName: process.env.BASE_REPO_NAME || 'xauth-base',
  git: {
    owner: process.env.GIT_OWNER!,
    branch: process.env.GIT_BRANCH!,
    token: process.env.GIT_TOKEN!,
    repository: process.env.GIT_REPOSITORY!
  }
};

export const zone: any = {
  zoneName: process.env.DNS_ZONE_NAME!,
  hostedZoneId: process.env.DNS_HOSTED_ZONE_ID!
};
