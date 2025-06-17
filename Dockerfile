# Use Node.js 20 as the base image
FROM node:20-alpine AS base

# Install necessary system packages
RUN apk add --no-cache libc6-compat python3 make g++ git

# Set the working directory in the container
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 9002

# Set environment variables
ENV NODE_ENV=development
ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

# Set the default command to run the app in development mode
CMD ["npm", "run", "dev"]
