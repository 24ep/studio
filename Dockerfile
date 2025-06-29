# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install only essential build tools
RUN apk add --no-cache curl

# Copy dependency files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund --prefer-offline

# Copy startup scripts first
COPY start-app.sh wait-for-db.sh ./

# Copy source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Prune dev dependencies for smaller production image
RUN npm prune --production

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-alpine

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache curl

# Don't run production as root
USER node

# Set NODE_ENV for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the necessary production artifacts from the builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/process-upload-queue.mjs ./process-upload-queue.mjs
COPY --chown=node:node --from=builder /app/ws-queue-bridge.js ./ws-queue-bridge.js
COPY --chown=node:node --from=builder /app/wait-for-db.sh ./wait-for-db.sh
COPY --chown=node:node --from=builder /app/start-app.sh ./start-app.sh
RUN chmod +x ./wait-for-db.sh ./start-app.sh

# Expose the port the app will run on
EXPOSE 9846

# Healthcheck for container health
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9846/api/health || exit 1

# Start the app using the startup script
CMD ["./start-app.sh"]