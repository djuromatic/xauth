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
    REACT_APP_AUTHORITY_URL: {
      value: process.env.FRONTEND_AUTHORITY_URL
    },
    REACT_APP_REDIRECT_URL: {
      value: process.env.FRONTEND_REDIRECT_URL
    },
    REACT_APP_CLIENT_ID: {
      value: process.env.FRONTEND_CLIENT_ID
    },
    REACT_APP_SCOPE: {
      value: process.env.FRONTEND_SCOPE
    },
    REACT_APP_RESPONSE_TYPE: {
      value: process.env.FRONTEND_RESPONSE_TYPE
    }
  }
};
