export SERVICE_NAME="xauth"
export HOSTNAME="xauth.test"
export PORT="3000"
export DB_HOST="localhost"
export DB_PORT="27017"
export DB_NAME="xauth"
export DB_USER="xauth"
export DB_PASS="xauth"
export OIDC_ISSUER="http://xauth.test:3000"
export LOGGER_LEVEL="debug"
export GOOGLE_CLIENT_ID="{SECRET}"
export GOOGLE_CLIENT_SECRET="{SECRET}"
export GOOGLE_REDIRECT_URI="https://${HOSTNAME}/interaction/callback/google"

# run app
npm run watch
