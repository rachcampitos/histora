# Build stage
FROM node:20-alpine AS builder

# Set memory limit for Node (Angular builds need more memory)
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy only necessary source files (exclude tests, docs, etc.)
COPY src ./src
COPY angular.json tsconfig*.json ./
COPY public ./public

# Build for production with optimizations
RUN npm run build -- --configuration=production

# Production stage with nginx (minimal image)
FROM nginx:alpine-slim AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from builder stage
COPY --from=builder /app/dist/histora-front/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
