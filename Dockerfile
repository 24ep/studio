# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Build the app
RUN npm run build

# Expose port
EXPOSE 9002

# Start the app
CMD ["npm", "run", "dev"]
