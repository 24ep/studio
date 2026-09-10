import { logUserActivity } from '@/lib/userActivityLog';
import type { DbClient } from '@/lib/db';

import type { AzureAdUserSyncData } from './azure-ad-sync-types';
import type {
  AzureAdSyncSession,
  AzureAdUserUpdateData,
  ExistingAzureAdUserRow,
} from './azure-ad-sync-database-types';

export async function getExistingUsersByAzureIdentity(
  client: DbClient,
  userDataMap: Map<string, AzureAdUserSyncData>
) {
  const emails = Array.from(userDataMap.keys());
  const azureOids = Array.from(userDataMap.values()).map(user => user.azureOid);
  const existingUsersResult = await client.query<ExistingAzureAdUserRow>(
    'SELECT id, email, "azure_oid", "userGroupId", "avatarUrl" FROM "User" WHERE email = ANY($1::text[]) OR "azure_oid" = ANY($2::text[])',
    [emails, azureOids]
  );

  const byEmail = new Map<string, ExistingAzureAdUserRow>();
  const byOid = new Map<string, ExistingAzureAdUserRow>();

  for (const user of existingUsersResult.rows) {
    byEmail.set(user.email, user);
    if (user.azure_oid) {
      byOid.set(user.azure_oid, user);
    }
  }

  return { byEmail, byOid };
}

export async function updateExistingAzureAdUsers(
  client: DbClient,
  usersToUpdate: AzureAdUserUpdateData[],
  session: AzureAdSyncSession,
  sendProgress: (message: string) => void
) {
  if (usersToUpdate.length === 0) {
    return 0;
  }

  sendProgress(`Updating ${usersToUpdate.length} existing users in database...`);
  await client.query('BEGIN');
  try {
    for (const user of usersToUpdate) {
      await updateAzureAdUser(client, user);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  await logUpdatedAzureAdUsers(usersToUpdate, session);
  return usersToUpdate.length;
}

async function updateAzureAdUser(client: DbClient, user: AzureAdUserUpdateData) {
  await client.query(
    `UPDATE "User" SET
      "azure_oid" = COALESCE("azure_oid", $1),
      "deleted_from_ad" = false,
      "department" = $2,
      "userTeamId" = $3,
      "avatarUrl" = COALESCE($4, "avatarUrl"),
      "office_location" = COALESCE($5, "office_location"),
      "employee_id" = COALESCE($6, "employee_id"),
      "company_name" = COALESCE($7, "company_name"),
      "employee_type" = COALESCE($8, "employee_type"),
      "hire_date" = COALESCE($9, "hire_date"),
      "manager" = COALESCE($10, "manager"),
      "manager_email" = COALESCE($11, "manager_email"),
      "sam_account_name" = COALESCE($12, "sam_account_name"),
      "contact_info" = COALESCE($13, "contact_info")
    WHERE id = $14`,
    [
      user.azureOid,
      user.department,
      user.userTeamId,
      user.avatarUrl,
      user.officeLocation,
      user.employeeId,
      user.companyName,
      user.employeeType,
      user.hireDate,
      user.manager,
      user.managerEmail,
      user.samAccountName,
      user.contactInfo ? JSON.stringify(user.contactInfo) : null,
      user.id,
    ]
  );
}

async function logUpdatedAzureAdUsers(
  usersToUpdate: AzureAdUserUpdateData[],
  session: AzureAdSyncSession
) {
  for (const user of usersToUpdate) {
    await logUserActivity({
      userId: user.id,
      action: 'AD_SYNC_UPDATE',
      details: {
        syncedBy: session.user.email,
        deletedFromAd: false,
      },
      performedBy: session.user.id,
    });
  }
}
