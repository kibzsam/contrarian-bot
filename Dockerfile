# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for cache layer
COPY package*.json ./
RUN npm install

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Create dirs for persistent data
RUN mkdir -p /app/data /app/logs

# Only copy production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JS files from builder
COPY --from=builder /app/dist ./dist

# Copy openclaw config and strategy config
COPY openclaw.json ./
COPY src/config ./src/config

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose healthcheck port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
