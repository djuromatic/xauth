export interface ExplorerConfig {
  name: string;
  envName: string;
  vpc: {
    vpcId?: string;
    cidr?: string;
  };
}
