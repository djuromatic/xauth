import { CfnOutput } from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { InstanceType, IPeer, ISubnet, IVpc, MachineImage, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { ExplorerALB } from './alb-construct';
import { DnsAndCertificateConstruct } from './dns-certificate-construct';

export interface EC2WebProps {
  hostname: string;
  vpc: IVpc;
  instanceType: InstanceType;
  subnetType: SubnetType;
  zone: IHostedZone;
  whitelistedIps?: IPeer[]; // IPs that can access the webserver via SSH or if a in case of a private subnet, the load balancer HTTPS
  sshKeyName: string;
  commands?: string[];
  sshOnly?: boolean;
  healthCheck?: string;
}

export class EC2Web extends Construct {
  public readonly securityGroup: SecurityGroup;
  public readonly vpc: IVpc;
  public readonly hostname: string;
  public readonly subnets: ISubnet[];

  constructor(scope: Construct, id: string, props: EC2WebProps) {
    super(scope, id);
    this.vpc = props.vpc;
    this.hostname = props.hostname;

    this.subnets = props.subnetType === SubnetType.PUBLIC ? this.vpc.publicSubnets : this.vpc.privateSubnets;

    this.securityGroup = new SecurityGroup(this, `SecurityGroup`, {
      description: `${this.hostname} Security Group`,
      vpc: this.vpc,
      allowAllOutbound: true
    });
    const { whitelistedIps = [] } = props;
    whitelistedIps.forEach((ip) => {
      this.securityGroup.addIngressRule(ip, Port.tcp(22), 'Allow SSH traffic');
    });

    const asg = new AutoScalingGroup(this, 'instance', {
      vpc: this.vpc,
      instanceType: props.instanceType,
      machineImage: MachineImage.genericLinux({
        'eu-central-1': 'ami-0c8061a0933e62881'
      }),
      securityGroup: this.securityGroup,
      vpcSubnets: { subnets: this.subnets },
      keyName: props.sshKeyName,
      minCapacity: 1,
      maxCapacity: 1,
      desiredCapacity: 1
    });

    // create certificate and validate it
    const dns = new DnsAndCertificateConstruct(this, `certificate-${this.hostname}`, {
      zone: props.zone,
      hostname: this.hostname
    });

    const { sshOnly = false } = props;
    if (!sshOnly) {
      const { httpsListener, alb } = new ExplorerALB(this, 'ApplicationLoadBalancer', {
        vpc: this.vpc,
        certificate: dns.certificate,
        hostname: this.hostname,
        zone: props.zone,
        internetFacing: true
      });

      httpsListener.addTargets(`${this.hostname}-target-group`, {
        port: 80,
        targetGroupName: `${this.hostname}-target-group`,
        priority: 1,
        healthCheck: {
          path: props.healthCheck ?? '/'
        },
        targets: [asg],
        conditions: [ListenerCondition.pathPatterns(['/*'])]
      });

      this.securityGroup.connections.allowFrom(alb, Port.tcp(80));
    }
  }

  /**
   *
   * @param peer Interface for classes that provide the peer-specification parts of a security group rule
   * @param connection Interface for classes that provide the connection-specification parts of a security group rule
   * @description Adds a rule to the security group that allows connections from the specified peer
   */
  addIngressRule(peer: IPeer, connection: Port, description?: string) {
    this.securityGroup.addIngressRule(peer, connection, description);
  }

  /**
   * @param securityGroup security group to allow connections from
   * @param connection rule for the connection
   */
  addAllowFromSecurityGroup(securityGroup: SecurityGroup, connection: Port) {
    this.securityGroup.connections.allowFrom(securityGroup, connection);
  }
}
