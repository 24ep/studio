import { randomUUID } from "crypto";

import { getPool, type DbClient } from "@/lib/db";

import type { SystemPreferenceInput } from "./system-preferences-schema";

export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

type SystemPreferenceRow = {
  key: string;
  value: unknown;
};

export async function fetchSystemPreferences() {
  const result = await getPool().query<SystemPreferenceRow>(
    'SELECT key, value FROM "SystemPreference" WHERE "userId" = $1',
    [SYSTEM_USER_ID]
  );

  return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
}

export async function saveSystemPreferences(client: DbClient, prefsToSave: SystemPreferenceInput) {
  const keysToUpdate = Object.keys(prefsToSave);

  if (keysToUpdate.length > 0) {
    const placeholders = keysToUpdate.map((_, index) => `$${index + 2}`).join(",");
    await client.query(
      `DELETE FROM "SystemPreference" WHERE "userId" = $1 AND key IN (${placeholders})`,
      [SYSTEM_USER_ID, ...keysToUpdate]
    );
  }

  for (const [key, value] of Object.entries(prefsToSave)) {
    await client.query(
      `INSERT INTO "SystemPreference" (id, "userId", key, value, "createdAt", "updatedAt")
       VALUES ($1::uuid, $2, $3, $4, NOW(), NOW())`,
      [randomUUID(), SYSTEM_USER_ID, key, value]
    );
  }
}
