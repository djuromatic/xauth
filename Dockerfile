FROM node:18.14.2-alpine3.17 as builder
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build

# stage 2 build copy dist folder and package.json
FROM node:18.14.2-alpine3.17 as final
WORKDIR /app

COPY --from=builder /app/dist/ ./
COPY --from=builder /app/db-cert.pem ./db-cert.pem
#copy package.json
COPY --from=builder /app/package*.json ./

#install dependencies
RUN npm install --production
RUN npm prune --production
RUN npm cache clean --force

RUN ls -la

USER node
CMD node ./index.js