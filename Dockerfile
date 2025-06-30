# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
# Generate Prisma client before building Next.js
RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 9846
CMD ["npm", "run", "start"]