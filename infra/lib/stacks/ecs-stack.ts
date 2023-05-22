import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DnsAndCertificateConstruct } from '../constructs/dns-certificate-construct';
import { VpcConstruct } from '../constructs/vpc-construct';
import { ECSServiceGroup } from '../constructs/ecs-service-group';
import { S3Frontend } from '../constructs/s3-frontend';
import { xAuthIdentityProviderConfiguretion } from '../config';
import { appConfig, zone } from '../config/app.config';

/**
 * This stack is responsible for creating the infrastructure for the ECS services.
 */

export class EcsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Returns VPC and subnets for the application.
     * If VpcId provided it will try to use existing one,
     * otherwise it will create a new VPC.
     */
    const vpcConstruct = new VpcConstruct(this, `${appConfig.envName}-${appConfig.name}-vpc`, {
      vpcId: appConfig.vpc.vpcId,
      name: appConfig.envName + '-' + appConfig.name,
      cidr: appConfig.vpc.cidr
    });
    const { vpc } = vpcConstruct;

    //ECS CLUSTER
    const cluster = new ecs.Cluster(this, `${appConfig.envName}-${appConfig.name}-cluster`, {
      vpc: vpc,
      clusterName: `${appConfig.envName}-${appConfig.name}-cluster`
    });

    // Create role for ecs task definitions
    const taskRole = new iam.Role(this, `${appConfig.envName}-${appConfig.name}-taskRole`, {
      roleName: `${appConfig.envName}-${appConfig.name}-taskRole`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Permissions for cloudwatch logs
    const cloudWatchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents',
        'logs:GetLogEvents',
        'logs:FilterLogEvents',
        'logs:PutRetentionPolicy'
      ],
      resources: ['*']
    });
    taskRole.addToPolicy(cloudWatchPolicy);

    // Add policy to role for ecs task definitions
    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'cloudwatch:PutMetricData',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]
    });
    const cert = new DnsAndCertificateConstruct(this, `${appConfig.envName}-${appConfig.name}-dns`, {
      zone,
      hostname: '*'
    });

    const usCert = new DnsAndCertificateConstruct(this, `${appConfig.envName}-${appConfig.name}-cf-dns`, {
      zone,
      hostname: '*',
      cloudfront: true
    });

    /*
      Faragate Service Configuration
    */
    const fargateServices = [xAuthIdentityProviderConfiguretion]; // fargate service configurations
    fargateServices.forEach((serviceConfig) => {
      new ECSServiceGroup(this, `${serviceConfig.hostname}`, {
        cluster,
        vpc,
        appConfig,
        taskRole,
        executionRolePolicy,
        serviceConfig,
        certificate: cert.certificate,
        usCertificate: usCert.certificate,
        zone,
        baseRepoName: appConfig.baseRepoName
      });
    });

    // const frontendBucket = new S3Frontend(this, `appConfig Frontend Bucket`, {
    //   envName: appConfig.envName,
    //   bucketName: `${appConfig.envName}-${appConfig.name}-frontend`.toLowerCase(),
    //   zoneName: zone.zoneName,
    //   zone: zone,
    //   repo: appConfig.git.repository,
    //   repoOwner: appConfig.git.owner,
    //   repoBranch: appConfig.git.branch,
    //   gitTokenSecretPath: appConfig.git.token,
    //   account: this.account
    // });
  }
}
