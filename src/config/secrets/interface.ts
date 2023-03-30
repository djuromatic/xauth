export interface ISecrets {
  mongo: {
    host: string;
    port: number;
    username: string;
    password: string;
    db_name: string;
  };
}
