FROM node:14-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV REDIS_PASSWORD=${REDIS_PASSWORD}
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# Debug: Show Node and npm versions
RUN node -v && npm -v

# Debug: List installed packages
RUN npm list --depth=0

# Build the application with more memory
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
