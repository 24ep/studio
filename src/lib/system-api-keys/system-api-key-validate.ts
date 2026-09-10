import { getPool } from "@/lib/db";
import { hashApiKey, isSystemApiKeyFormat } from "./system-api-key-crypto";
import { mapRowToApiKeyData, type SystemApiKeyRow } from "./system-api-key-records";
import {
  getSystemApiKeyInvalidReason,
  recordSystemApiKeyUsage,
} from "./system-api-key-validation";
import type { ValidateApiKeyResult } from "./system-api-key-types";

export async function validateApiKey(
  key: string,
  ipAddress?: string,
): Promise<ValidateApiKeyResult> {
  if (!isSystemApiKeyFormat(key)) {
    return { valid: false, error: "Invalid API key format" };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query<SystemApiKeyRow>(
      `SELECT * FROM "SystemApiKey" WHERE key_hash = $1`,
      [hashApiKey(key)],
    );

    if (result.rows.length === 0) {
      return { valid: false, error: "API key not found" };
    }

    const apiKeyData = mapRowToApiKeyData(result.rows[0]);
    const invalidReason = getSystemApiKeyInvalidReason(apiKeyData);
    if (invalidReason) {
      return { valid: false, error: invalidReason };
    }

    await recordSystemApiKeyUsage(client, apiKeyData.id, ipAddress);
    return { valid: true, data: apiKeyData };
  } catch (error) {
    console.error("[SystemApiKey] Error validating API key:", error);
    return { valid: false, error: "Failed to validate API key" };
  } finally {
    client.release();
  }
}
