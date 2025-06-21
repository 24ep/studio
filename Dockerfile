# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Declare build-time arguments to receive them from docker-compose
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG AZURE_AD_CLIENT_ID
ARG AZURE_AD_CLIENT_SECRET
ARG AZURE_AD_TENANT_ID
ARG GOOGLE_API_KEY

# Set them as environment variables for the build process
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID
ENV AZURE_AD_CLIENT_SECRET=$AZURE_AD_CLIENT_SECRET
ENV AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID
ENV GOOGLE_API_KEY=$GOOGLE_API_KEY

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Print environment variables for debugging
RUN echo "--- Build-time Environment Variables ---" && printenv && echo "------------------------------------"

# Build the Next.js app
RUN npm run build

# Remove development dependencies for a smaller final image
RUN npm prune --production

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]