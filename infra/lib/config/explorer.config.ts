import { ExplorerConfig } from "./iconfig";

export const explorer: ExplorerConfig = {
  name: process.env.APP_NAME || "explorer",
  envName: process.env.ENV_NAME || "dev",
  vpc: {
    vpcId: process.env.VPC_ID,
    cidr: "",
  },
};

export const zone: any = {
  zoneName: process.env.DNS_ZONE_NAME!,
  hostedZoneId: process.env.DNS_HOSTED_ZONE_ID!,
};
