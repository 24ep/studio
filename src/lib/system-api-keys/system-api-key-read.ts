import { getPool } from "@/lib/db";
import { mapRowToApiKeyData, type SystemApiKeyRow } from "./system-api-key-records";
import type { ApiKeyData } from "./system-api-key-types";

export async function listApiKeys(): Promise<ApiKeyData[]> {
  const pool = getPool();

  try {
    const result = await pool.query<SystemApiKeyRow>(
      `SELECT * FROM "SystemApiKey" ORDER BY "createdAt" DESC`,
    );

    return result.rows.map(mapRowToApiKeyData);
  } catch (error) {
    console.error("[SystemApiKey] Error listing API keys:", error);
    return [];
  }
}

export async function getApiKeyById(id: string): Promise<ApiKeyData | null> {
  const pool = getPool();

  try {
    const result = await pool.query<SystemApiKeyRow>(
      `SELECT * FROM "SystemApiKey" WHERE id = $1`,
      [id],
    );

    return result.rows.length === 0 ? null : mapRowToApiKeyData(result.rows[0]);
  } catch (error) {
    console.error("[SystemApiKey] Error getting API key:", error);
    return null;
  }
}
