# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on (as defined in package.json dev script)
EXPOSE 9002

# Set the default command to run the app in development mode
CMD ["npm", "run", "dev"]
