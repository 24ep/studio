# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20 AS builder

WORKDIR /app

# Install netcat and clean up apt cache in one layer
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Declare and set build-time environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG AZURE_AD_TENANT_ID
ARG GOOGLE_API_KEY
ARG NEXT_PUBLIC_GOOGLE_FONTS_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY
ENV NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=$NEXT_PUBLIC_GOOGLE_FONTS_API_KEY

# Show node and npm versions for debugging
RUN node -v && npm -v

# Copy dependency files first for better caching
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
# RUN npm install --legacy-peer-deps
RUN npm install 

# Copy source code
COPY . .

# Show environment and directory contents for debugging
RUN printenv && ls -al

# Build the Next.js application
RUN echo "=== Directory listing before build ===" && ls -al && \
    echo "=== tsconfig.json ===" && cat tsconfig.json && \
    echo "=== package.json ===" && cat package.json && \
    echo "=== About to run npm run build ===" && npm run build

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20

WORKDIR /app

# Don't run production as root
USER node

# Set NODE_ENV for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the necessary production artifacts from the builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/process-upload-queue.js ./process-upload-queue.js

# Expose the port the app will run on
EXPOSE 9846

# Start the app
CMD ["npm", "start"]