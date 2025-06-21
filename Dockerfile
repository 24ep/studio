# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-alpine AS builder

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
RUN apk add --no-cache --virtual .build-deps build-base python3 && yarn install --frozen-lockfile && apk del .build-deps

# Copy source code - This layer is cached if your source code doesn't change
COPY . .

# Build the Next.js application - This only runs if source code has changed
RUN yarn build

# Prune development dependencies for the final stage
RUN npm prune --production

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-alpine

WORKDIR /app

# Don't run production as root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
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