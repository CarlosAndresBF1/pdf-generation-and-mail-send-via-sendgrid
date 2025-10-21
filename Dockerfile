
# Development stage - optimized for hot reload and debugging
FROM node:22-alpine AS development

WORKDIR /app

# Install Chrome dependencies for Puppeteer + sudo for dev containers
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    curl \
    freetype \
    freetype-dev \
    harfbuzz \
    nss \
    sudo \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user and configure sudo
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    echo "nestjs ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Copy package files
COPY --chown=nestjs:nodejs package*.json ./

# Install ALL dependencies (including dev dependencies for development)
RUN npm ci --legacy-peer-deps

# Copy source code (will be overridden by volume in dev)
COPY --chown=nestjs:nodejs . .

# Ensure nestjs owns the entire /app directory
RUN chown -R nestjs:nodejs /app

# Change to non-root user
USER nestjs

# Expose ports (app + debugger)
EXPOSE 3000 9229

# Development command with hot reload and debugging enabled
CMD ["npm", "run", "start:debug"]

# Build stage
FROM node:22-alpine AS builder

RUN echo "RUNNING BUILD STAGE"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Install Chrome dependencies for testing (needed for Puppeteer tests)
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    freetype \
    freetype-dev \
    harfbuzz \
    nss \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Run linting, tests, and build the application
RUN echo "🔍 Running lint..." && npm run lint && \
    echo "🧪 Running unit tests..." && npm run test && \
    echo "🚀 Running e2e tests..." && npm run test:e2e && \
    echo "🏗️ Building application..." && npm run build

# Production stage
FROM node:22-alpine AS production

RUN echo "RUNNING PRODUCTION STAGE"

# Install Chrome dependencies for Puppeteer (for PDF generation in production)
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    freetype \
    freetype-dev \
    harfbuzz \
    nss \
    ttf-freefont \
    ttf-opensans \
    udev \
    wqy-zenhei

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Additional environment variables for Puppeteer stability
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding"

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/src/certificates/templates ./src/certificates/templates

# Change to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Start the application
CMD ["node", "dist/main"]