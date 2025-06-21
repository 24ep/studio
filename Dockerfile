# =================================================================
# == Stage 1: Build Stage
# =================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies to leverage Docker cache
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Generate Prisma Client (requires schema.prisma to be present)
RUN npx prisma generate

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
