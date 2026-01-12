# Use Bun as the runtime
FROM oven/bun:1 as base

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the frontend
RUN bun run build

# Production stage
FROM base AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json bun.lockb ./

# Install only production dependencies
RUN bun install --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client
COPY prisma ./prisma

# Generate Prisma client (if not already generated)
RUN npx prisma generate

# Copy server source code
COPY src/server ./src/server

# Copy config directory (optional - will use defaults if not present)
COPY config ./config

# Create a startup script
COPY <<'EOF' /app/start.sh
#!/bin/bash

# Change to app directory
cd /app

# Run database migrations
npx prisma migrate deploy

# Start the server
exec bun src/server/index.ts
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["/app/start.sh"]
