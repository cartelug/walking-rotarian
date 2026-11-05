FROM node:24-alpine
WORKDIR /app
COPY package.json build.mjs ./
COPY src ./src
COPY server ./server
ARG BASE_PATH=/walking-rotarian
ARG SITE_URL=https://cartelug.github.io/walking-rotarian
ENV BASE_PATH=$BASE_PATH SITE_URL=$SITE_URL
RUN node build.mjs && mkdir -p /data && chown -R node:node /data
ENV PORT=8080 HOST=0.0.0.0 NODE_ENV=production DATA_DIR=/data
USER node
EXPOSE 8080
CMD ["node", "server/index.mjs"]
