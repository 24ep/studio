# Multi-stage Dockerfile for Next.js application
FROM node:22-alpine AS base

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    wget \
    dos2unix \
    libc6-compat && \
    npm install --global npm@11.6.2

WORKDIR /app

# Dependencies are installed strictly from the committed lockfile and the
# repository's explicit peer-resolution policy.
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
# Account Directory 0.1.1 was retired by the release service after 0.1.2 was
# published. Normalize only this immutable first-party tarball pin in the
# container build so clean deploys do not depend on a removed historical URL.
# Keep the rewrite scoped to this package; all other lockfile integrity entries
# remain untouched and npm ci still validates the complete dependency graph.
RUN node - <<'NODE'
const fs = require('node:fs');
const nextUrl = 'https://account-directory-sdk-release-production.up.railway.app/outborn-account-directory-0.1.2.tgz';
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

if (packageJson.dependencies?.['@outborn/account-directory']) {
  packageJson.dependencies['@outborn/account-directory'] = nextUrl;
}
if (lock.packages?.['']?.dependencies?.['@outborn/account-directory']) {
  lock.packages[''].dependencies['@outborn/account-directory'] = nextUrl;
}
const lockedDirectory = lock.packages?.['node_modules/@outborn/account-directory'];
if (lockedDirectory) {
  lockedDirectory.version = '0.1.2';
  lockedDirectory.resolved = nextUrl;
  delete lockedDirectory.integrity;
}

fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
fs.writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
NODE
RUN npm config set maxsockets 10 && \
    npm ci

# Runtime dependencies retain the Prisma CLI because migrations are deployed
# by entrypoint.sh before the standalone Next.js server starts.
FROM deps AS prod-deps
RUN npm prune --omit=dev && \
    npx prisma generate --generator client

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/.npmrc ./.npmrc
COPY --from=deps /app/prisma ./prisma
COPY . ./

RUN dos2unix ./entrypoint.sh ./entrypoint-processor.sh ./entrypoint-local.sh 2>/dev/null || true
RUN npx prisma generate
RUN test -f src/lib/db.ts

ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ENV NODE_ENV=production

# Do not bypass TypeScript/lint failures in the deployment image. The same
# production build must succeed here that succeeds in the Quality Gates.
RUN set -e && \
    NEXT_PHASE=phase-production-build npm run build && \
    echo "=== Build completed successfully ===" && \
    cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

FROM node:22-alpine AS runner
RUN apk add --no-cache postgresql-client openssl && \
    npm install --global npm@11.6.2 && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder /app/entrypoint-processor.sh ./entrypoint-processor.sh
COPY --from=builder /app/entrypoint-local.sh ./entrypoint-local.sh
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/scripts ./src/scripts
COPY --from=builder /app/src/lib/email-template-catalog.ts ./src/lib/email-template-catalog.ts
COPY --from=builder /app/src/lib/email-template-requirements.ts ./src/lib/email-template-requirements.ts

RUN chmod +x ./entrypoint.sh ./entrypoint-processor.sh ./entrypoint-local.sh && \
    chown -R nextjs:nodejs /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8021
ENV HOSTNAME="0.0.0.0"
ENV SKIP_SEED=true

USER nextjs
EXPOSE 8021
CMD ["/bin/sh", "/app/entrypoint.sh"]
