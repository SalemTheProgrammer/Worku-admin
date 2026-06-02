# Multi-stage build for Worku-admin Angular SPA
# Stage 1: build with Node, Stage 2: serve static files with nginx
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm ci

COPY . .

RUN npm run build -- --configuration production

# Stage 2: nginx serving the built SPA on plain HTTP (TLS terminated upstream)
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/worku-admin/browser /usr/share/nginx/html

RUN apk add --no-cache curl

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
