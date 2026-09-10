import { afterEach, describe, expect, it } from "vitest";

import {
  buildPoolConfig,
  buildPrismaConnectionString,
} from "./database-connection";

const REMOTE_DATABASE_URL =
  "postgresql://user:password@database.example.com:5432/app";
const originalEnvironment = {
  databaseSsl: process.env.DATABASE_SSL,
  rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  nodeEnvironment: process.env.NODE_ENV,
};

afterEach(() => {
  restoreEnvironmentVariable("DATABASE_SSL", originalEnvironment.databaseSsl);
  restoreEnvironmentVariable(
    "DATABASE_SSL_REJECT_UNAUTHORIZED",
    originalEnvironment.rejectUnauthorized,
  );
  restoreEnvironmentVariable("NODE_ENV", originalEnvironment.nodeEnvironment);
});

describe("database connection TLS settings", () => {
  it("uses encrypted TLS without certificate verification in development", () => {
    setEnvironmentVariable("NODE_ENV", "development");
    delete process.env.DATABASE_SSL;
    delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

    const poolConfig = buildPoolConfig(REMOTE_DATABASE_URL);
    const prismaUrl = new URL(buildPrismaConnectionString(REMOTE_DATABASE_URL));

    expect(poolConfig.ssl).toEqual({ rejectUnauthorized: false });
    expect(prismaUrl.searchParams.get("sslmode")).toBe("require");
    expect(prismaUrl.searchParams.get("uselibpqcompat")).toBe("true");
  });

  it("keeps strict certificate verification in production", () => {
    setEnvironmentVariable("NODE_ENV", "production");
    delete process.env.DATABASE_SSL;
    delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

    const poolConfig = buildPoolConfig(REMOTE_DATABASE_URL);
    const prismaUrl = new URL(buildPrismaConnectionString(REMOTE_DATABASE_URL));

    expect(poolConfig.ssl).toEqual({ rejectUnauthorized: true });
    expect(prismaUrl.searchParams.get("sslmode")).toBe("verify-full");
  });

  it("allows an explicit development-only TLS opt-out for incompatible local clients", () => {
    setEnvironmentVariable("NODE_ENV", "development");
    process.env.DATABASE_SSL = "false";
    delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;

    const poolConfig = buildPoolConfig(REMOTE_DATABASE_URL);
    const prismaUrl = new URL(buildPrismaConnectionString(REMOTE_DATABASE_URL));

    expect(poolConfig.ssl).toBe(false);
    expect(prismaUrl.searchParams.get("sslmode")).toBe("disable");
  });

  it("does not allow the TLS opt-out in production", () => {
    setEnvironmentVariable("NODE_ENV", "production");
    process.env.DATABASE_SSL = "false";

    const poolConfig = buildPoolConfig(REMOTE_DATABASE_URL);
    const prismaUrl = new URL(buildPrismaConnectionString(REMOTE_DATABASE_URL));

    expect(poolConfig.ssl).toEqual({ rejectUnauthorized: true });
    expect(prismaUrl.searchParams.get("sslmode")).toBe("verify-full");
  });
});

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function setEnvironmentVariable(name: string, value: string) {
  process.env[name] = value;
}
