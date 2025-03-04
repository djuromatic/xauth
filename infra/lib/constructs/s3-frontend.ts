import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { DnsAndCertificateConstruct } from './dns-certificate-construct';
import { frontend } from '../config';
import { CiCdS3Frontend } from './cicd-s3-front';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
export interface S3ReactProps {
  envName: string;
  bucketName: string;
  zoneName: string;
  zone: IHostedZone;
  repoName: string;
  repoOwner: string;
  repoBranch: string;
  gitTokenSecretPath: string;
  account: string;
}

export class S3Frontend extends Construct {
  constructor(scope: Construct, id: string, props: S3ReactProps) {
    super(scope, id);

    const { hostname } = frontend;
    const siteDomain = `${hostname}.${props.zoneName}`;

    const siteBucket = new s3.Bucket(this, 'ExplorerFrontend', {
      bucketName: props.bucketName,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    // Grant access to cloudfron
    new CfnOutput(this, 'Bucket-Output', { value: siteBucket.bucketName });

    const cert = new DnsAndCertificateConstruct(this, 'cert', {
      zone: props.zone,
      hostname: hostname,
      cloudfront: true
    });
    const { certificate } = cert;
    const myResponseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: `${props.envName}-explorer-response-header`,
      comment: 'A default policy',
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET'],
        accessControlAllowOrigins: [siteDomain],
        accessControlMaxAge: Duration.seconds(600),
        originOverride: true
      },
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER,
          override: true
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.seconds(600),
          includeSubdomains: true,
          override: true
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true
        }
      }
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${props.bucketName}`
    });
    // grant s3:list, s3:getBucket, s3:getObject to the OAI
    siteBucket.grantRead(cloudfrontOAI);

    const distribution = new cloudfront.Distribution(this, 'Cloud-front-s3-frontend', {
      defaultRootObject: 'index.html',
      domainNames: [siteDomain],
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ],
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(siteBucket, {
          originAccessIdentity: cloudfrontOAI
        }),
        compress: true,
        responseHeadersPolicy: myResponseHeadersPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    });
    // distribution.node.addDependency(cloudfrontOAI);

    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: props.zone
    });

    // // react needs to be build in order to be deployed to s3
    // // it can be ignored and can run in a separate pipeline
    // const path = `${process.cwd()}/../frontend/dist`;
    // // Deploy site contents to S3 bucket
    // new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
    //   sources: [s3deploy.Source.asset(path)],
    //   destinationBucket: siteBucket,
    //   distribution,
    //   distributionPaths: ["/*"],
    // });

    new CiCdS3Frontend(this, 'cicd', {
      distributionId: distribution.distributionId,
      bucket: props.bucketName,
      repo: props.repoName,
      repoOwner: props.repoOwner,
      repoBranch: props.repoBranch,
      gitTokenSecretPath: props.gitTokenSecretPath,
      environmentVariables: frontend.env,
      account: props.account,
      nodejs: frontend.nodejs,
      projectFolderName: frontend.projectFolderName
    });
  }
}
