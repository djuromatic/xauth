import { Stack, App, StackProps, CfnOutput } from 'aws-cdk-lib';
import { InstanceType, InstanceClass, InstanceSize, SubnetType, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { EC2Web } from '../constructs/ec2-web-construct';
import { VpcConstruct } from '../constructs/vpc-construct';

export interface ExplorerToolsProps extends StackProps {
  name: string;
  zone: IHostedZone;
  sshKeyName: string;
  vpcId: string;
}

export class ExplorerTools extends Stack {
  constructor(scope: App, id: string, props: ExplorerToolsProps) {
    super(scope, id, props);

    const { vpc } = new VpcConstruct(this, 'xauth', {
      vpcId: props.vpcId
    });

    const xauth = new EC2Web(this, 'xmanna', {
      hostname: 'id',
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.M5, InstanceSize.LARGE),
      subnetType: SubnetType.PUBLIC,
      zone: props.zone,
      whitelistedIps: [Peer.ipv4('109.198.9.3/32')],
      sshKeyName: props.sshKeyName,
      sshOnly: false,
      healthCheck: '/health'
    });

    const react = new EC2Web(this, 'client-example', {
      hostname: 'app',
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.M5, InstanceSize.LARGE),
      subnetType: SubnetType.PUBLIC,
      zone: props.zone,
      whitelistedIps: [Peer.ipv4('109.198.9.3/32')],
      sshKeyName: props.sshKeyName,
      sshOnly: false
    });
  }
}
