# Use Node.js 20 as the base image
FROM node:20-alpine

# Install necessary system packages
RUN apk add --no-cache libc6-compat python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./
COPY components.json ./

# Install dependencies
RUN npm install

# Copy source code and other necessary directories
COPY src/ ./src/
COPY lib/ ./lib/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port
EXPOSE 9002

# Set hostname for Next.js
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "run", "dev"]
