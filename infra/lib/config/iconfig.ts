export interface AppConfig {
  name: string;
  envName: string;
  vpc: {
    vpcId?: string;
    cidr?: string;
  };
  git: {
    owner: string;
    branch: string;
    token: string;
    repository: string;
  };
}

export interface ServiceConfig {
  projectFolderName: string; // the name of folder in the project that contains the service
  hostname: string; // the hostname of the service
  privateNode?: boolean; // if true, the service will be deployed in a private subnet with private alb
  cloudfront?: {
    hostname: string;
  };
  port: number;
  logGroup: string;
  taskDefinition: {
    cpu: number;
    memoryLimitMiB: number;
  };
  targetGroup: {
    pathPatterns: [string];
    priority: number;
    healthcheck: {
      path: string;
    };
  };
  autoScaling?: {
    minCapacity: number;
    maxCapacity: number;
    scaleOnRequestCountNumber: number;
  };
  ecr: {
    repositoryName: string;
    tag: string;
  };
  env?: any;
  secretVars?: { envName: string; type: string; parameterName: string }[];
}
