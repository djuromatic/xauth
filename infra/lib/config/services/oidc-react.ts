export interface FrontendEnvVars {
  [key: string]: {
    value: string | undefined;
  };
}

export interface FrontendS3Config {
  projectFolderName: string;
  bucketName: string;
  hostname: string;
  env: FrontendEnvVars;
  nodejs: string; //16.x.x, 16.17.0
}

export const frontend: FrontendS3Config = {
  projectFolderName: process.env.FRONTEND_PROJECT_FOLDER_NAME!,
  nodejs: process.env.FRONTEND_NODEJS_VERSION!,
  hostname: process.env.FRONTEND_HOSTNAME!,
  bucketName: process.env.FRONTEND_BUCKET_NAME!,
  env: {
    APP_NAME: {
      value: process.env.FRONTEND_APP_NAME
    }
  }
};
