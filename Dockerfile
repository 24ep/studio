# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Limit Node.js memory usage during build (1GB limit to prevent excessive usage)
ENV NODE_OPTIONS=--max-old-space-size=1024

# Install only essential build tools
RUN apk add --no-cache curl

# Declare and set build-time environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG AZURE_AD_TENANT_ID
ARG GOOGLE_API_KEY
ARG NEXT_PUBLIC_GOOGLE_FONTS_API_KEY

ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY
ENV NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=$NEXT_PUBLIC_GOOGLE_FONTS_API_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=development

# Copy dependency files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with aggressive optimization (include dev deps for Prisma)
RUN npm ci --no-audit --no-fund --prefer-offline --cache /tmp/.npm --maxsockets 1 --silent

# Copy only necessary files for build (exclude node_modules, .git, etc.)
COPY prisma ./prisma
COPY src ./src
COPY next.config.js ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY components.json ./
COPY lib ./lib
COPY next-env.d.ts ./
COPY .eslintrc.json ./

# Generate Prisma client with memory optimization
RUN ls -la prisma/ && npx prisma generate --schema=./prisma/schema.prisma

# Build the Next.js application with memory optimization and faster build
RUN ls -la && echo "Starting build..." && npm run build

# Prune dev dependencies for smaller production image
RUN npm prune --production --silent

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-alpine

WORKDIR /app

# Limit Node.js memory usage in production (1GB limit to prevent excessive usage)
ENV NODE_OPTIONS=--max-old-space-size=1024

# Install only runtime dependencies
RUN apk add --no-cache curl

# Don't run production as root
USER node

# Set NODE_ENV for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the necessary production artifacts from the builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/process-upload-queue.mjs ./process-upload-queue.mjs
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/ws-queue-bridge.js ./ws-queue-bridge.js
COPY --chown=node:node wait-for-db.sh ./wait-for-db.sh
RUN chmod +x ./wait-for-db.sh

# Expose the port the app will run on
EXPOSE 9846

# Healthcheck for container health
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9846/api/health || exit 1

# Start the app with migrations and seeding, waiting for DB first
CMD ./wait-for-db.sh "$DB_HOST:$DB_PORT" -- npx prisma migrate deploy && npx prisma db:seed && npm run start