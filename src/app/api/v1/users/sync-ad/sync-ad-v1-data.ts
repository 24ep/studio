import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { V1AzureAdSyncResults, V1AzureAdUserSyncData } from './sync-ad-v1-types';

const HIRING_MANAGER_GROUP_ID = '00000000-0000-0000-0000-000000000003';

export type DbClient = {
  query: (query: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

type ExistingV1AzureAdUserRow = {
  id: string;
  email: string;
  azure_oid?: string | null;
  userGroupId?: string | null;
};

export async function fetchExistingV1AzureAdUsers(
  client: DbClient,
  userDataMap: Map<string, V1AzureAdUserSyncData>,
) {
  const emails = Array.from(userDataMap.keys());
  const azureOids = Array.from(userDataMap.values()).map(user => user.azureOid);
  const existingUsersResult = await client.query(
    'SELECT id, email, "azure_oid", "userGroupId" FROM "User" WHERE email = ANY($1::text[]) OR "azure_oid" = ANY($2::text[])',
    [emails, azureOids],
  );

  const byEmail = new Map<string, ExistingV1AzureAdUserRow>();
  const byOid = new Map<string, ExistingV1AzureAdUserRow>();

  for (const user of existingUsersResult.rows as ExistingV1AzureAdUserRow[]) {
    byEmail.set(user.email, user);
    if (user.azure_oid) {
      byOid.set(user.azure_oid, user);
    }
  }

  return { byEmail, byOid };
}

export function classifyV1AzureAdUsers(
  userDataMap: Map<string, V1AzureAdUserSyncData>,
  existingUsers: {
    byEmail: Map<string, ExistingV1AzureAdUserRow>;
    byOid: Map<string, ExistingV1AzureAdUserRow>;
  },
  results: V1AzureAdSyncResults,
) {
  const usersToUpdate = [];
  const usersToCreate = [];

  for (const [email, userData] of userDataMap) {
    try {
      const existingUser = existingUsers.byEmail.get(email) || existingUsers.byOid.get(userData.azureOid);

      if (existingUser) {
        usersToUpdate.push({
          id: existingUser.id,
          azureOid: userData.azureOid,
        });
      } else {
        usersToCreate.push(userData);
      }
    } catch (error) {
      results.errors.push({
        email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { usersToUpdate, usersToCreate };
}

export async function updateExistingV1AzureAdUsers(client: DbClient, usersToUpdate: Array<{ id: string; azureOid: string }>) {
  if (usersToUpdate.length === 0) {
    return 0;
  }

  await client.query('BEGIN');
  try {
    for (const user of usersToUpdate) {
      await client.query(
        'UPDATE "User" SET "azure_oid" = COALESCE("azure_oid", $1), "deleted_from_ad" = false WHERE id = $2',
        [user.azureOid, user.id],
      );
    }
    await client.query('COMMIT');
    return usersToUpdate.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function createV1AzureAdUsers(client: DbClient, usersToCreate: V1AzureAdUserSyncData[]) {
  if (usersToCreate.length === 0) {
    return 0;
  }

  const placeholderPassword = await createV1AzureAdPlaceholderPassword();

  await client.query('BEGIN');
  try {
    for (const userData of usersToCreate) {
      await client.query(
        `INSERT INTO "User" (
          id, name, email, "emailVerified", role, password, 
          "authentication_methods", "azure_oid", "userGroupId", "is_active",
          department, "jobTitle",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          uuidv4(),
          userData.name,
          userData.email,
          new Date(),
          'Recruiter',
          placeholderPassword,
          ['azure_ad'],
          userData.azureOid,
          HIRING_MANAGER_GROUP_ID,
          true,
          userData.department,
          userData.jobTitle,
        ],
      );
    }
    await client.query('COMMIT');
    return usersToCreate.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function createV1AzureAdPlaceholderPassword() {
  const secureRandom = randomBytes(32).toString('hex');
  return bcrypt.hash(`azure-ad-placeholder-${Date.now()}-${secureRandom}`, 10);
}
