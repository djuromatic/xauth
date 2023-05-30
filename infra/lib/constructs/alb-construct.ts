import { Construct } from 'constructs';
import { IVpc, SecurityGroup, Peer, Port, ISubnet, IPeer } from 'aws-cdk-lib/aws-ec2';
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ListenerAction
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { CfnOutput } from 'aws-cdk-lib';

export interface ExplorerALBProps {
  hostname: string;
  internetFacing: boolean;
  vpc: IVpc;
  certificate: ICertificate;
  zone: IHostedZone;
}

export class ExplorerALB extends Construct {
  public readonly alb: ApplicationLoadBalancer;
  public readonly httpsListener: ApplicationListener;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: ExplorerALBProps) {
    super(scope, id);

    const { hostname, vpc, certificate, zone, internetFacing = true } = props;
    /*
      Public ALB
    */
    this.securityGroup = new SecurityGroup(this, `alb-sg`, {
      description: `ALB Endpoint SG`,
      vpc,
      allowAllOutbound: true // Rules to access the Fargate apps will be added by CDK
    });

    this.securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow all');

    this.alb = new ApplicationLoadBalancer(this, `load-balancer`, {
      vpc: vpc,
      internetFacing,
      securityGroup: this.securityGroup,
      vpcSubnets: {
        subnets: internetFacing ? vpc.publicSubnets : vpc.privateSubnets
      }
    });

    this.httpsListener = this.alb.addListener('https-listener', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      open: internetFacing,
      certificates: [certificate]
    });

    this.httpsListener.addAction('default', {
      action: ListenerAction.fixedResponse(404, {
        messageBody: 'Page not found'
      })
    });

    this.alb.addRedirect({
      sourceProtocol: ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: ApplicationProtocol.HTTPS,
      targetPort: 443,
      open: internetFacing
    });

    // adding a new A Record into route 53 for the Application Load Balancer
    new ARecord(this, `-a-record`, {
      zone,
      recordName: hostname,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(this.alb))
    });
    // Outputs DNS of Application Load Balancer
    new CfnOutput(this, `-alb-dns`, {
      value: this.alb.loadBalancerDnsName,
      description: `${hostname} ALB DNS`
    });
  }

  addIngressRule(peer: IPeer, description: string) {
    this.securityGroup.addIngressRule(peer, Port.tcp(443), description);
  }
}
