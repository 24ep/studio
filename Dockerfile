# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-slim AS builder

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

# Install dependencies - This layer is cached if yarn.lock doesn't change
COPY package.json yarn.lock ./
RUN yarn install

# Copy source code - This layer is cached if your source code doesn't change
COPY . .

# Build the Next.js application - This only runs if source code has changed
RUN yarn build

# Prune development dependencies for the final stage
RUN npm prune --production

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-slim

WORKDIR /app

# Don't run production as root
RUN groupadd -r -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nextjs
USER nextjs

# Copy only the necessary production artifacts from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Set this to disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Start the app
CMD ["yarn", "start"]