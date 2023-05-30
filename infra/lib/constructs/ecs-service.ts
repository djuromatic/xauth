import { Construct } from 'constructs';
import { ServiceConfig } from '../config';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import {
  FargateTaskDefinition,
  Secret,
  ContainerImage,
  Protocol,
  FargateService,
  ICluster,
  AwsLogDriver
} from 'aws-cdk-lib/aws-ecs';
import { PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { IRepository, Repository } from 'aws-cdk-lib/aws-ecr';
import { ISubnet, IVpc, SecurityGroup, Port, Peer } from 'aws-cdk-lib/aws-ec2';
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ListenerCondition
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface FargateServiceProps {
  serviceConfig: ServiceConfig;
  taskRole: Role;
  envName: string;
  executionRolePolicy: PolicyStatement;
  vpc: IVpc;
  cluster: ICluster;
  appSubnets: ISubnet[];
  httpsListener: ApplicationListener;
  alb: ApplicationLoadBalancer;
}

export class FargateServiceConstruct extends Construct {
  public readonly service: FargateService;
  public readonly repository: IRepository;
  constructor(scope: Construct, id: string, props: FargateServiceProps) {
    super(scope, id);

    const { serviceConfig, taskRole, envName, executionRolePolicy, vpc, cluster, appSubnets, httpsListener, alb } =
      props;

    const logGroup = new LogGroup(this, `logGroup`, {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
      logGroupName: `${serviceConfig.logGroup}-${envName}`
    });

    const logging = new AwsLogDriver({
      streamPrefix: serviceConfig.hostname,
      logGroup
    });

    const taskDefinition = new FargateTaskDefinition(this, `task`, {
      taskRole,
      memoryLimitMiB: serviceConfig.taskDefinition.memoryLimitMiB,
      cpu: serviceConfig.taskDefinition.cpu
    });

    taskDefinition.addToExecutionRolePolicy(executionRolePolicy);
    this.repository = Repository.fromRepositoryName(
      this,
      `${serviceConfig.hostname}-repo`,
      `${serviceConfig.ecr.repositoryName}`
    );
    let secrets = {};
    if (serviceConfig.secrets) {
      //for eache secret map it to [key, value] pair
      secrets = Object.entries(serviceConfig.secrets).reduce((acc, [key, value]) => {
        const secret = secretsmanager.Secret.fromSecretCompleteArn(this, `${key.split(':').pop()}-secret`, key);
        //grant read access to the secret to the task role
        secret.grantRead(taskRole);
        //map each secret to the container env variable
        value.forEach(({ parametarName, envName }) => {
          acc = { ...acc, [envName]: ecs.Secret.fromSecretsManager(secret, parametarName) };
        });
        return acc;
      }, {});
    }

    console.log(JSON.stringify(secrets));

    const container = taskDefinition.addContainer(`container`, {
      image: ContainerImage.fromEcrRepository(this.repository, serviceConfig.ecr.tag),
      containerName: serviceConfig.hostname,
      secrets,
      logging,
      environment: { ...serviceConfig.env }
    });

    container.addPortMappings({
      containerPort: serviceConfig.port,
      protocol: Protocol.TCP
    });

    const securityGroup = new SecurityGroup(this, `security-group`, {
      vpc: vpc,
      description: `Security group for ${serviceConfig.hostname}`,
      allowAllOutbound: true,
      securityGroupName: `${serviceConfig.hostname}-security-group`
    });

    this.service = new FargateService(this, `fargate-service`, {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      serviceName: serviceConfig.hostname,
      assignPublicIp: false,
      securityGroups: [securityGroup],
      vpcSubnets: { subnets: appSubnets }
    });

    const serviceTargetGroup = httpsListener.addTargets(`target-group`, {
      port: 80,
      targetGroupName: `${envName}-${serviceConfig.hostname}`,
      priority: serviceConfig.targetGroup.priority,
      healthCheck: {
        path: serviceConfig.targetGroup.healthcheck.path
      },
      targets: [this.service],
      conditions: [ListenerCondition.pathPatterns(serviceConfig.targetGroup.pathPatterns)]
    });
    securityGroup.connections.allowFrom(alb, Port.tcp(80));

    if (serviceConfig.autoScaling) {
      const scaling = this.service.autoScaleTaskCount({
        minCapacity: serviceConfig.autoScaling.minCapacity,
        maxCapacity: serviceConfig.autoScaling.maxCapacity
      });

      scaling.scaleOnRequestCount(`${serviceConfig.hostname}-cpu-scaling`, {
        requestsPerTarget: serviceConfig.autoScaling.scaleOnRequestCountNumber,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(300),
        targetGroup: serviceTargetGroup
      });
    }
  }
}
