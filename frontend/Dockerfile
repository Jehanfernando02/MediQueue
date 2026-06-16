# ──────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Compiles the React/Vite app to a static dist/ bundle
# ──────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
ARG VITE_API_URL=https://mediqueue.onrender.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# ──────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime (Nginx)
# Serves the compiled static files — no Node.js runtime in prod image
# ──────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="MediQueue Frontend"
LABEL org.opencontainers.image.description="React SPA for MediQueue clinic management"
LABEL org.opencontainers.image.source="https://github.com/Jehanfernando02/MediQueue"

# Custom nginx config for SPA routing (all unknown paths → index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
