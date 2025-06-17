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
COPY app/ ./app/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port
EXPOSE 9002

# Set environment variables
ENV NODE_ENV=development
ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

# Set the default command to run the app in development mode
CMD ["npm", "run", "dev"]
