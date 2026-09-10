import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import type { DbClient } from '@/lib/db';
import { logUserActivity } from '@/lib/userActivityLog';

import type { AzureAdUserSyncData } from './azure-ad-sync-types';
import type { AzureAdSyncSession, UserIdRow } from './azure-ad-sync-database-types';

export async function createAzureAdUsers(
  client: DbClient,
  usersToCreate: AzureAdUserSyncData[],
  session: AzureAdSyncSession,
  sendProgress: (message: string) => void
) {
  if (usersToCreate.length === 0) {
    return 0;
  }

  sendProgress(`Creating ${usersToCreate.length} new users in database...`);
  const placeholderPassword = await createAzureAdPlaceholderPassword();
  const hiringManagerGroupId = await ensureHiringManagerGroup(client);

  await client.query('BEGIN');
  try {
    for (const userData of usersToCreate) {
      await insertAzureAdUser(client, userData, hiringManagerGroupId, placeholderPassword);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  await logCreatedAzureAdUsers(client, usersToCreate, session);
  return usersToCreate.length;
}

async function createAzureAdPlaceholderPassword() {
  const secureRandom = randomBytes(32).toString('hex');
  return bcrypt.hash(`azure-ad-placeholder-${Date.now()}-${secureRandom}`, 10);
}

async function ensureHiringManagerGroup(client: DbClient) {
  const groupResult = await client.query<UserIdRow>(
    'SELECT id FROM "UserGroup" WHERE name = $1',
    ['Hiring Manager']
  );

  if (groupResult.rows.length > 0) {
    return groupResult.rows[0].id;
  }

  const hiringManagerGroupId = uuidv4();
  await client.query(
    `INSERT INTO "UserGroup" (id, name, description, permissions, "is_default", "is_system_role", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [
      hiringManagerGroupId,
      'Hiring Manager',
      'View-only access for hiring decisions',
      ['applicantS_VIEW', 'applicantS_VIEW_DETAILED', 'applicantS_COMMENTS_VIEW', 'POSITIONS_VIEW', 'TASK_BOARD_VIEW', 'DASHBOARD_VIEW', 'USER_PREFERENCES_MANAGE_OWN'],
      false,
      false,
    ]
  );

  return hiringManagerGroupId;
}

async function insertAzureAdUser(
  client: DbClient,
  userData: AzureAdUserSyncData,
  hiringManagerGroupId: string,
  placeholderPassword: string
) {
  await client.query(
    `INSERT INTO "User" (
      id, name, email, "emailVerified", role, password,
      "authentication_methods", "azure_oid", "userGroupId", "is_active",
      department, "position_title", "userTeamId", "avatarUrl",
      "office_location", "employee_id", "company_name", "employee_type",
      "hire_date", "manager", "manager_email", "sam_account_name", "contact_info",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())`,
    [
      uuidv4(),
      userData.name,
      userData.email,
      new Date(),
      'Hiring Manager',
      placeholderPassword,
      ['azure_ad'],
      userData.azureOid,
      hiringManagerGroupId,
      true,
      userData.department,
      userData.jobTitle,
      userData.userTeamId,
      userData.avatarUrl,
      userData.officeLocation,
      userData.employeeId,
      userData.companyName,
      userData.employeeType,
      userData.hireDate,
      userData.manager,
      userData.managerEmail,
      userData.samAccountName,
      userData.contactInfo ? JSON.stringify(userData.contactInfo) : null,
    ]
  );
}

async function logCreatedAzureAdUsers(
  client: DbClient,
  usersToCreate: AzureAdUserSyncData[],
  session: AzureAdSyncSession
) {
  for (const userData of usersToCreate) {
    const createdUser = await client.query<UserIdRow>(
      'SELECT id FROM "User" WHERE email = $1',
      [userData.email]
    );
    if (createdUser.rows[0]) {
      await logUserActivity({
        userId: createdUser.rows[0].id,
        action: 'AD_SYNC_CREATED',
        details: { syncedBy: session.user.email },
        performedBy: session.user.id,
      });
    }
  }
}
