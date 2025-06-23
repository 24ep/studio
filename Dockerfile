# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20 AS builder

WORKDIR /app

# Declare and set build-time environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG AZURE_AD_TENANT_ID
ARG GOOGLE_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source code - This layer is cached if your source code doesn't change
COPY . .

# Build the Next.js application - This only runs if source code has changed
RUN npm run build

# Prune development dependencies for the final stage
# No need for prune, as npm install in production stage will handle it.

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20

WORKDIR /app

# Don't run production as root
# The node:20 image comes with a non-root 'node' user, which we will use.
USER node

# Copy only the necessary production artifacts from the builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 9846

# Set this to disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Start the app
CMD ["npm", "start"]