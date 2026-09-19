FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV npm_config_fetch_retries=5 \
	npm_config_fetch_retry_mintimeout=20000 \
	npm_config_fetch_retry_maxtimeout=120000
COPY package*.json ./
RUN for attempt in 1 2 3; do npm ci --legacy-peer-deps && break || test "$attempt" = 3 || echo "Retrying npm install"; done
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN for attempt in 1 2 3; do npm ci --omit=dev --legacy-peer-deps && break || test "$attempt" = 3 || echo "Retrying npm install"; done && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
