import { randomUUID } from "crypto";

import { logAudit } from "@/lib/auditLog";
import { getPool } from "@/lib/db";
import { generateApiKey, getKeyDisplayPrefix, hashApiKey } from "./system-api-key-crypto";
import { mapRowToApiKeyData, type SystemApiKeyRow } from "./system-api-key-records";
import { getSystemApiKeyErrorMessage } from "./system-api-key-validation";
import type { CreateApiKeyInput, CreateApiKeyResult } from "./system-api-key-types";

export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const fullKey = generateApiKey();
    const keyHash = hashApiKey(fullKey);
    const keyPrefix = getKeyDisplayPrefix(fullKey);

    const result = await client.query<SystemApiKeyRow>(
      `INSERT INTO "SystemApiKey"
        (id, name, description, key_prefix, key_hash, is_active, expires_at, created_by_id, "createdAt", "updatedAt")
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        randomUUID(),
        input.name,
        input.description || null,
        keyPrefix,
        keyHash,
        true,
        input.expiresAt || null,
        input.createdById || null,
      ],
    );

    const apiKeyData = mapRowToApiKeyData(result.rows[0]);

    await logAudit(
      "AUDIT",
      `API key "${input.name}" created`,
      "SystemApiKey:Create",
      input.createdById || null,
      { keyId: apiKeyData.id, keyPrefix },
    );

    return {
      success: true,
      apiKey: fullKey,
      data: apiKeyData,
    };
  } catch (error) {
    console.error("[SystemApiKey] Error creating API key:", error);
    await logAudit(
      "ERROR",
      `Failed to create API key "${input.name}": ${getSystemApiKeyErrorMessage(error)}`,
      "SystemApiKey:Create",
      input.createdById || null,
    );
    return {
      success: false,
      error: "Failed to create API key",
    };
  } finally {
    client.release();
  }
}
