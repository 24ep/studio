import { PrismaClient } from "@prisma/client";
import { buildPrismaConnectionString } from "./database-connection";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
const log =
  process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

// Optimized Prisma client with connection pool limits for lower memory usage
const prisma =
  globalForPrisma.prisma ||
  (databaseUrl
    ? new PrismaClient({
        datasources: { db: { url: buildPrismaConnectionString(databaseUrl) } },
        log: [...log],
      })
    : new PrismaClient({ log: [...log] }));

// Always cache in globalThis to prevent connection pool exhaustion
globalForPrisma.prisma = prisma;

export default prisma;
