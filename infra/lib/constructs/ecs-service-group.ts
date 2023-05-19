import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ICluster } from 'aws-cdk-lib/aws-ecs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { AppConfig, ServiceConfig } from '../config';
import { ExplorerALB } from './alb-construct';
import { CiCdConstruct } from './cicd-construct';
import { ExplorerCloudFront } from './cloud-front';
import { FargateServiceConstruct } from './ecs-service';
import { WafExplorer } from './waf';

export interface EcsServiceGroupProps {
  serviceConfig: ServiceConfig;
  taskRole: Role;
  appConfig: AppConfig;
  vpc: IVpc;
  certificate: ICertificate;
  usCertificate: ICertificate;
  executionRolePolicy: any;
  cluster: ICluster;
  zone: IHostedZone;
  baseRepoName: string;
}

export class ECSServiceGroup extends Construct {
  constructor(scope: Construct, id: string, props: EcsServiceGroupProps) {
    super(scope, id);

    const { serviceConfig, taskRole, appConfig, vpc, certificate, usCertificate, executionRolePolicy, cluster, zone } =
      props;

    // Creates Application Load balancer
    // and attaches it to the VPC and creates a listener on port 443
    // and attaches the certificate to the listener
    // creates a record set in the zone for the domain name
    // it can be private load balancer if marked as privateNode = true
    const { privateNode } = serviceConfig;
    const explorerAlb = new ExplorerALB(this, `alb`, {
      vpc,
      internetFacing: !privateNode,
      certificate,
      hostname: serviceConfig.hostname,
      zone
    });
    const { httpsListener, alb } = explorerAlb;

    //TODO - add WAF
    // if (!privateNode) {
    //   new WafExplorer(this, `waf`, {
    //     alb
    //   });
    // }

    // Create the Fargate Service
    const fargateService = new FargateServiceConstruct(this, `service`, {
      serviceConfig,
      taskRole,
      envName: appConfig.envName,
      executionRolePolicy,
      vpc,
      cluster,
      appSubnets: vpc.privateSubnets,
      httpsListener,
      alb
    });
    const { service, repository } = fargateService;

    //Repo containing images for node and nginx
    const baseRepo = Repository.fromRepositoryName(this, `${serviceConfig.hostname}-node-repo`, props.baseRepoName);
    const cicd = new CiCdConstruct(this, `cicd`, {
      service: serviceConfig,
      cluster,
      repository,
      baseRepo,
      fargateService: service,
      envName: appConfig.envName,
      gitOwner: appConfig.git.owner,
      gitBranch: appConfig.git.branch,
      gitTokenSecretPath: appConfig.git.token,
      gitRepository: appConfig.git.repository
    });

    // creates a pipeline for the service

    const { cloudfront } = serviceConfig;
    if (cloudfront !== undefined && cloudfront.hostname) {
      if (serviceConfig.privateNode) throw new Error('private node and cloudfront are not compatible');
      const { distribution } = new ExplorerCloudFront(this, `cloudfront`, {
        zone,
        appName: `${appConfig.envName}-${cloudfront.hostname}`,
        hostname: cloudfront.hostname,
        originHostname: serviceConfig.hostname,
        certificate: usCertificate
      });
    }
  }
}
