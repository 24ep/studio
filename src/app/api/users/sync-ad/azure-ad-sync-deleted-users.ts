import type { DbClient } from '@/lib/db';
import { logUserActivity } from '@/lib/userActivityLog';

import type { AzureAdSyncResults, AzureAdUserSyncData } from './azure-ad-sync-types';
import type {
  AzureAdSyncSession,
  DeletedAzureAdUserRow,
} from './azure-ad-sync-database-types';

export async function markDeletedAzureAdUsers(
  client: DbClient,
  userDataMap: Map<string, AzureAdUserSyncData>,
  results: AzureAdSyncResults,
  session: AzureAdSyncSession,
  sendProgress: (message: string) => void
) {
  sendProgress('Checking for deleted users...');
  const usersDeletedFromAD = await getUsersDeletedFromAzureAd(client, userDataMap);

  if (usersDeletedFromAD.length === 0) {
    return;
  }

  sendProgress(`Marking ${usersDeletedFromAD.length} users as deleted...`);
  await client.query('BEGIN');
  try {
    for (const deletedUser of usersDeletedFromAD) {
      await markDeletedAzureAdUser(client, deletedUser, session);
      results.deleted++;
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[AD SYNC] Failed to mark deleted users:', error);
  }
}

async function getUsersDeletedFromAzureAd(
  client: DbClient,
  userDataMap: Map<string, AzureAdUserSyncData>
) {
  const adOidsSet = new Set(Array.from(userDataMap.values()).map(user => user.azureOid));
  const azureUsersInDB = await client.query<DeletedAzureAdUserRow>(
    'SELECT id, email, "azure_oid", "deleted_from_ad" FROM "User" WHERE "azure_oid" IS NOT NULL AND "deleted_from_ad" = false AND \'azure_ad\' = ANY("authentication_methods")'
  );

  return azureUsersInDB.rows.filter(
    dbUser => !adOidsSet.has(dbUser.azure_oid)
  );
}

async function markDeletedAzureAdUser(
  client: DbClient,
  deletedUser: DeletedAzureAdUserRow,
  session: AzureAdSyncSession
) {
  await client.query(
    'UPDATE "User" SET "deleted_from_ad" = true WHERE id = $1',
    [deletedUser.id]
  );

  await logUserActivity({
    userId: deletedUser.id,
    action: 'DELETED_FROM_AD',
    details: {
      markedBy: 'AD_SYNC',
      previousEmail: deletedUser.email,
      syncedBy: session.user.email,
    },
    performedBy: session.user.id,
  });
}
