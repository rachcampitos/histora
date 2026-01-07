# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files from histora-back
COPY histora-back/package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code from histora-back
COPY histora-back/ .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY histora-back/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Rebuild bcrypt for this architecture
RUN npm rebuild bcrypt --build-from-source

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Expose port (Railway uses PORT env var)
EXPOSE ${PORT:-3000}

# Start the application
CMD ["node", "dist/main"]
