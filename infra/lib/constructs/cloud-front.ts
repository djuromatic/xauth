import { CfnOutput } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

import { Construct } from "constructs";

export interface ExplorerCloudFrontProps {
  zone: IHostedZone;
  appName: string;
  hostname: string;
  originHostname: string;
  certificate: ICertificate;
}

export class ExplorerCloudFront extends Construct {
  public readonly distribution: cloudfront.Distribution;
  constructor(scope: Construct, id: string, props: ExplorerCloudFrontProps) {
    super(scope, id);

    const { zone, appName, hostname, certificate, originHostname } = props;

    this.distribution = new cloudfront.Distribution(this, `${appName}-dist`, {
      domainNames: [
        `${hostname}.${zone.zoneName}`,
        // `${originHostname}.${zone.zoneName}`,
      ],
      defaultBehavior: {
        origin: new HttpOrigin(`${originHostname}.${zone.zoneName}`),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      certificate,
    });

    const cdnRecord = new ARecord(this, `${hostname}Alias`, {
      recordName: `explorer`,
      zone,
      comment: `DNS Alias for ${hostname}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
    });
    cdnRecord.node.addDependency(this.distribution);

    // Outputs DNS of Application Load Balancer
    new CfnOutput(this, `${id}-cloudfront-dns`, {
      value: this.distribution.distributionDomainName,
      description: `${hostname} CF DNS`,
    });
  }
}
