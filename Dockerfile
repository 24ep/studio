FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Compile process-upload-queue.ts to process-upload-queue.mjs
RUN npx tsc process-upload-queue.ts --module NodeNext --target es2020 --esModuleInterop --moduleResolution nodenext --outDir . && \
    mv process-upload-queue.js process-upload-queue.mjs

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

EXPOSE 9846

CMD ["./entrypoint.sh"]