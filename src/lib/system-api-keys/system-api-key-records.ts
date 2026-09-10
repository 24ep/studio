import type { QueryResultRow } from 'pg';
import type { ApiKeyData, ApiKeyUpdateInput } from './system-api-key-types';

export type SystemApiKeyRow = QueryResultRow & {
  id: string;
  name: string;
  description: string | null;
  key_prefix: string;
  is_active: boolean;
  expires_at: Date | null;
  last_used_at: Date | null;
  last_used_ip: string | null;
  usage_count: number;
  created_by_id: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SystemApiKeyDeleteRow = QueryResultRow & {
  name: string;
  key_prefix: string;
};

export function mapRowToApiKeyData(row: SystemApiKeyRow): ApiKeyData {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    keyPrefix: row.key_prefix,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    lastUsedIp: row.last_used_ip,
    usageCount: row.usage_count,
    createdById: row.created_by_id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function buildApiKeyUpdateQuery(id: string, updates: ApiKeyUpdateInput) {
  const setClauses: string[] = ['"updatedAt" = NOW()'];
  const values: Array<string | boolean | Date | null> = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }
  if (updates.expiresAt !== undefined) {
    setClauses.push(`expires_at = $${paramIndex++}`);
    values.push(updates.expiresAt);
  }

  values.push(id);

  return {
    sql: `UPDATE "SystemApiKey" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  };
}
