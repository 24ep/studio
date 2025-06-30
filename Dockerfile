# Use official Node.js base image
FROM node:20-alpine as base

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Copy your specific configuration files
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node start.sh ./start.sh
COPY --chown=node:node wait-for-db.sh ./wait-for-db.sh
COPY --chown=node:node process-upload-queue.mjs ./process-upload-queue.mjs
COPY --chown=node:node ws-queue-bridge.js ./ws-queue-bridge.js

# Make scripts executable
RUN chmod +x ./start.sh ./wait-for-db.sh

# Generate Prisma client
RUN npx prisma generate

# Set environment for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the app will run on
EXPOSE 9846

# Healthcheck for container health
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9846/api/health || exit 1

# Start the app with the startup script
CMD ["./start.sh"]