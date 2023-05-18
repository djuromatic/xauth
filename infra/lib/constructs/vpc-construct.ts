import { IVpc, Vpc, SubnetType, ISubnet } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface VpcProps {
  vpcId: string;
  name: string;
  cidr: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: IVpc;
  public readonly publicSubnets: ISubnet[];
  public readonly appSubnets: ISubnet[];

  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    const { vpcId, name, cidr } = props;

    if (vpcId) {
      this.vpc = Vpc.fromLookup(this, "vpc", {
        vpcId: vpcId,
      });
    } else {
      this.vpc = new Vpc(this, `${name}-vpc`, {
        cidr: cidr,
        maxAzs: 3, // Default is all AZs in region
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: "Public",
            subnetType: SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: "Private",
            subnetType: SubnetType.PRIVATE_WITH_NAT,
          },
          {
            cidrMask: 24,
            name: "Isolated",
            subnetType: SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
    }

    const { publicSubnets } = this.vpc;
    if (!publicSubnets.length) {
      throw new Error("We need at least one public subnet in the VPC");
    }
    this.publicSubnets = publicSubnets;

    // Get application private subnets to deploy Apps
    const appSubnets = this.vpc.privateSubnets;
    if (!appSubnets.length) {
      throw new Error("We need at least one application subnet in the VPC");
    }
    this.appSubnets = appSubnets;
  }
}
