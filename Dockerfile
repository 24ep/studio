# Use Node.js 20 as the base image
FROM node:20-alpine AS base

# Install necessary system packages
RUN apk add --no-cache libc6-compat python3 make g++ git

# Set the working directory in the container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Install project dependencies
RUN npm install

# Create necessary directories
RUN mkdir -p src public

# Copy source code and public files
COPY src/ ./src/
COPY public/ ./public/

# Expose the port the app runs on
EXPOSE 9002

# Set environment variables
ENV NODE_ENV=development
ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

# Set the default command to run the app in development mode
CMD ["npm", "run", "dev"]
