# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Declare build arguments
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG AZURE_AD_TENANT_ID

# Set them as environment variables
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID

# Install dependencies to leverage Docker cache
# Copy package.json and the prisma schema first.
# This allows Prisma's install scripts to run correctly.
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Copy environment files if present
COPY .env .env
COPY .env.local .env.local

# Print environment variables for debugging
RUN printenv

# Build the Next.js application for production
RUN npm run build

# =================================================================
# == Stage 2: Production Stage
# =================================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/package.json ./
RUN npm install --production

# Copy built Next.js application from builder stage
COPY --from=builder /app/.next ./.next

# Copy public assets
COPY --from=builder /app/public ./public

# Expose the port the app will run on
EXPOSE 3000

# Set the default command to start the app in production mode
CMD ["npm", "run", "start"]
