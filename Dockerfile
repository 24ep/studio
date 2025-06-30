# Use the 24ep/studio:dev image from Docker Hub as base
FROM 24ep/studio:dev

# Set working directory
WORKDIR /app

# Copy your specific configuration files
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node start.sh ./start.sh
COPY --chown=node:node wait-for-db.sh ./wait-for-db.sh
COPY --chown=node:node process-upload-queue.mjs ./process-upload-queue.mjs
COPY --chown=node:node ws-queue-bridge.js ./ws-queue-bridge.js

# Make scripts executable (using the node user)
USER node
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