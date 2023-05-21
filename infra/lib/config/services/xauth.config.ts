import { ServiceConfig } from '../iconfig';

export const xAuthIdentityProviderConfiguretion: ServiceConfig = {
  hostname: process.env.API_HOSTNAME || 'id',
  port: process.env.API_TARGET_PORT ? +process.env.API_TARGET_PORT : 80,
  logGroup: process.env.API_LOG_GROUP || 'log-id',
  taskDefinition: {
    cpu: process.env.API_TASK_CPU ? +process.env.API_TASK_CPU : 256,
    memoryLimitMiB: process.env.API_TASK_MEMORY ? +process.env.API_TASK_MEMORY : 512
  },
  targetGroup: {
    pathPatterns: ['/*'],
    priority: 1,
    healthcheck: {
      path: '/health'
    }
  },
  autoScaling: {
    minCapacity: process.env.API_AUTOSCALING_MIN_CAPACITY ? +process.env.API_AUTOSCALING_MIN_CAPACITY : 1,
    maxCapacity: process.env.API_AUTOSCALING_MAX_CAPACITY ? +process.env.API_AUTOSCALING_MAX_CAPACITY : 2,
    scaleOnRequestCountNumber: process.env.API_AUTOSCALING_REQUEST_COUNT_NUMBER
      ? +process.env.API_AUTOSCALING_REQUEST_COUNT_NUMBER
      : 10000
  },
  ecr: {
    repositoryName: process.env.XAUTH_ECR_REPOSITORY!,
    tag: 'latest'
  },
  env: {
    SERVICE_NAME: process.env.SERVICE_NAME,
    NODE_ENV: process.env.NODE_ENV,
    HOSTNAME: process.env.HOSTNAME,
    PORT: process.env.PORT,
    DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
    DB_NAME: process.env.DB_NAME,
    DB_TLS_PATH: process.env.DB_TLS_PATH,
    OIDC_ISSUER: process.env.OIDC_ISSUER,
    LOGGER_LEVEL: process.env.LOGGER_LEVEL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
    GOOGLE_ISSUER_URL: process.env.GOOGLE_ISSUER_URL,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
    APPLE_REDIRECT_URL: process.env.APPLE_REDIRECT_URL,
    APPLE_ISSUER_URL: process.env.APPLE_ISSUER_URL,

    AWS_SES_EMAIL_FROM: process.env.AWS_SES_EMAIL_FROM,
    AWS_REGION: process.env.AWS_REGION,
    AWS_SES_SOURCE_ARN: process.env.AWS_SES_SOURCE_ARN,

    OIDC_REDIRECT_URIS: process.env.OIDC_REDIRECT_URIS
  },
  secretsARN: {
    db: process.env.DB_SECRET_ARN!
  }
};
