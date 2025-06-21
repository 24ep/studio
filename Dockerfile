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

# Install dependencies using yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Print environment variables for debugging
RUN echo "--- Build-time Environment Variables ---" && printenv && echo "------------------------------------"

# Build the Next.js application
RUN yarn build

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy built Next.js application from builder stage
COPY --from=builder /app/.next ./.next

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["yarn", "start"]