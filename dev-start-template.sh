export NODE_ENV="local"

export SERVICE_NAME="xauth"
export HOSTNAME="xauth.test:3000"
export PORT="3000"

export OIDC_ISSUER="https://$HOSTNAME"
export LOGGER_LEVEL="debug"

export GOOGLE_CLIENT_ID=""
export GOOGLE_CLIENT_SECRET=""
export GOOGLE_REDIRECT_URI=""

export AWS_SES_EMAIL_FROM=""
export AWS_REGION=""
export AWS_SES_SOURCE_ARN=''

export APPLE_CLIENT_ID=""
export APPLE_CLIENT_SECRET=""
export APPLE_REDIRECT_URI=""
export APPLE_ISSUER_URL=""

# run app
npm run --inspect watch
