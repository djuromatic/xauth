FROM node:18.14.2-alpine3.17 as builder
ADD . /app
WORKDIR /app
RUN npm run i
RUN npm run build

# stage 2 build copy dist folder and package.json
FROM node:18.14.2-alpine3.17 as final

ENV NODE_ENV production
ENV SERVICE_NAME bizzllet

WORKDIR /app

COPY --from=builder /app/dist/ ./
#copy package.json
COPY --from=builder /app/package*.json ./

#copy package for libs
COPY --from=builder /app/libs/modules/package*.json ./libs/modules/
COPY --from=builder /app/libs/utils/package*.json ./libs/utils/

#install dependencies
RUN npm run app:install:production
RUN npm prune --production
RUN npm cache clean --force

USER node

CMD node ./apps/bizzlet/main.js