import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { VpcConstruct } from '../constructs/vpc-construct';

export interface DocumentDBStackProps extends cdk.StackProps {
  vpcId: string;
  username: string;
}

export class DocumentDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DocumentDBStackProps) {
    super(scope, id, props);

    // Set up a VPC
    const xauthVPC = new VpcConstruct(this, 'xauth', {
      vpcId: props.vpcId
    });

    const { vpc } = xauthVPC;

    // Define a security group
    const securityGroup = new ec2.SecurityGroup(this, 'DocumentDbSecurityGroup', {
      vpc,
      description: 'Allow all outbound traffic',
      allowAllOutbound: true
    });

    // Allow inbound connections on default port
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // Allow from anywhere
      ec2.Port.tcp(27017), // Default port
      'Allow inbound connections'
    );

    // Create a Secret in Secrets Manager
    const docDbSecret = new secretsmanager.Secret(this, 'DocumentDevDbSecret', {
      description: 'Master password for DocumentDB cluster',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: props.username }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\%[]?=&#;01:' // Exclude characters that are not valid in a password
      }
    });

    // Create a DocumentDB cluster
    const cluster = new docdb.DatabaseCluster(this, 'XauthDevDocumentDB', {
      engineVersion: '5.0.0',
      masterUser: {
        username: props.username,
        password: docDbSecret.secretValueFromJson('password')
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      vpcSubnets: {
        subnets: vpc.privateSubnets
      },
      vpc,
      dbClusterName: 'XauthDevDocumentDB',
      removalPolicy: cdk.RemovalPolicy.DESTROY // Update this based on your removal policy
    });

    //allow all traffic from within vpc 10.10.10.0/24
    cluster.connections.allowDefaultPortFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock));

    //output secretArn
    new cdk.CfnOutput(this, 'SecretArn', {
      value: docDbSecret.secretArn
    });

    //output cluster endpoint
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint.hostname
    });
  }
}
