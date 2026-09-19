FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV npm_config_fetch_retries=5 \
	npm_config_fetch_retry_mintimeout=20000 \
	npm_config_fetch_retry_maxtimeout=120000
COPY package*.json ./
RUN for attempt in 1 2 3; do npm ci --legacy-peer-deps && break || test "$attempt" = 3 || echo "Retrying npm install"; done
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_GOOGLE_MAPS_MAP_ID=
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
	VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
