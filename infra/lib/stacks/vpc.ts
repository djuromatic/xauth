import { Stack, App } from "aws-cdk-lib";
import { VpcConstruct } from "../constructs/vpc-construct";

export class VpcXauth extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);

    const { vpc } = new VpcConstruct(this, "xauth-vpc", {
      name: "xauth",
      cdir: "10.10.10.0/24",
    });
  }
}
