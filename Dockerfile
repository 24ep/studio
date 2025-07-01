# Use pre-built image from Docker Hub
FROM 24ep/studio:dev

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the application port
EXPOSE 9846

# The image already contains the built application
# Just start the application
CMD ["npm", "run", "start"]