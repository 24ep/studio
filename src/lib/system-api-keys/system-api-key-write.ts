import { logAudit } from "@/lib/auditLog";
import { getPool } from "@/lib/db";
import {
  buildApiKeyUpdateQuery,
  mapRowToApiKeyData,
  type SystemApiKeyDeleteRow,
  type SystemApiKeyRow,
} from "./system-api-key-records";
import type { ApiKeyData, ApiKeyUpdateInput } from "./system-api-key-types";

export async function updateApiKey(
  id: string,
  updates: ApiKeyUpdateInput,
  updatedById?: string,
): Promise<ApiKeyData | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const updateQuery = buildApiKeyUpdateQuery(id, updates);
    const result = await client.query<SystemApiKeyRow>(updateQuery.sql, updateQuery.values);

    if (result.rows.length === 0) {
      return null;
    }

    const apiKeyData = mapRowToApiKeyData(result.rows[0]);

    await logAudit(
      "AUDIT",
      `API key "${apiKeyData.name}" updated`,
      "SystemApiKey:Update",
      updatedById || null,
      { keyId: id, updates: Object.keys(updates) },
    );

    return apiKeyData;
  } catch (error) {
    console.error("[SystemApiKey] Error updating API key:", error);
    return null;
  } finally {
    client.release();
  }
}

export async function deleteApiKey(id: string, deletedById?: string): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const keyResult = await client.query<SystemApiKeyDeleteRow>(
      `SELECT name, key_prefix FROM "SystemApiKey" WHERE id = $1`,
      [id],
    );

    if (keyResult.rows.length === 0) {
      return false;
    }

    const keyInfo = keyResult.rows[0];
    const result = await client.query(
      `DELETE FROM "SystemApiKey" WHERE id = $1`,
      [id],
    );

    if (!result.rowCount || result.rowCount <= 0) {
      return false;
    }

    await logAudit(
      "AUDIT",
      `API key "${keyInfo.name}" (${keyInfo.key_prefix}...) deleted`,
      "SystemApiKey:Delete",
      deletedById || null,
      { keyId: id },
    );
    return true;
  } catch (error) {
    console.error("[SystemApiKey] Error deleting API key:", error);
    return false;
  } finally {
    client.release();
  }
}

export async function revokeApiKey(id: string, revokedById?: string): Promise<boolean> {
  const result = await updateApiKey(id, { isActive: false }, revokedById);

  if (!result) {
    return false;
  }

  await logAudit(
    "AUDIT",
    `API key "${result.name}" revoked`,
    "SystemApiKey:Revoke",
    revokedById || null,
    { keyId: id },
  );
  return true;
}
