import bcrypt from 'bcryptjs';

import { logAudit } from '@/lib/auditLog';
import type { DbClient } from '@/lib/db';
import {
  getAzureAdProfileAttributes,
  shouldSyncAzureAdProfileAttributes,
} from '@/lib/auth-config-utils';
import {
  PRE_REGISTERED_GROUP_ID,
  type AzureAdAccountRow,
  type AzureAdDbUser,
  type UsableAzureAdAccount,
  type UsableAzureAdProfile,
} from './auth-azure-ad-signin-types';
import { getAzureAdAllowedMethods } from './auth-azure-ad-signin-utils';
import {
  buildAzureAdAccountInsertValues,
  buildAzureAdAccountUpdateValues,
  buildAzureAdUserInsertValues,
  createAzureAdUserId,
} from './auth-azure-ad-user-operation-utils';

export async function createAzureAdUser(
  client: DbClient,
  profile: UsableAzureAdProfile,
  oid: string,
  picture: string | null,
) {
  try {
    const placeholderPassword = await bcrypt.hash('azure-ad-placeholder-' + Date.now(), 10);
    const uuid = createAzureAdUserId();

    await client.query(
      'INSERT INTO "User" (id, name, email, "emailVerified", image, role, password, "authentication_methods", "azure_oid", "userGroupId", "position_title", department, "phone_number", "office_location", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())',
      buildAzureAdUserInsertValues({
        oid,
        picture,
        placeholderPassword,
        profile,
        userId: uuid,
      }),
    );

    const res = await client.query('SELECT * FROM "User" WHERE email = $1 OR "azure_oid" = $2', [profile.email, oid]);
    const dbUser = res.rows[0] as AzureAdDbUser | undefined;

    if (!dbUser) {
      console.error('[AZURE AD SIGNIN] Failed to retrieve user after creation');
      await logAudit('ERROR', `Azure AD sign-in failed: Could not retrieve user after creation for ${profile.email}.`, 'Auth:SignIn', null);
      return null;
    }

    await logAudit('AUDIT', `New user '${profile.name || profile.email}' created via Azure AD SSO.`, 'Auth:SignIn', dbUser.id);
    await logAudit('AUDIT', `User '${profile.name || profile.email}' assigned to Pre-Registered User group via Azure AD SSO.`, 'Auth:SignIn', dbUser.id);

    return dbUser;
  } catch (createError) {
    console.error('[AZURE AD SIGNIN] Error creating user:', createError);
    await logAudit('ERROR', `Azure AD sign-in failed: Error creating user ${profile.email}. Error: ${createError instanceof Error ? createError.message : String(createError)}`, 'Auth:SignIn', null);
    return null;
  }
}

export async function prepareExistingAzureAdUser(
  client: DbClient,
  dbUser: AzureAdDbUser,
  profile: UsableAzureAdProfile,
) {
  if (!dbUser.is_active) {
    console.error('[AZURE AD SIGNIN] User account is disabled:', profile.email);
    await logAudit('WARN', `Azure AD sign-in blocked: User account ${profile.email} is disabled.`, 'Auth:SignIn', dbUser.id);
    return false;
  }

  await ensurePreRegisteredUserGroup(client, dbUser, profile);

  const allowedMethods = getAzureAdAllowedMethods(dbUser.authentication_methods);
  if (!allowedMethods.includes('azure_ad')) {
    console.error('[AZURE AD SIGNIN] Azure AD login attempted but not allowed for user:', profile.email);
    await logAudit('WARN', `Azure AD sign-in blocked: User ${profile.email} does not have Azure AD authentication enabled.`, 'Auth:SignIn', dbUser.id);
    return false;
  }

  await syncAzureAdProfileAttributes(client, dbUser, profile);
  return true;
}

async function ensurePreRegisteredUserGroup(
  client: DbClient,
  dbUser: AzureAdDbUser,
  profile: UsableAzureAdProfile,
) {
  if (dbUser.userGroupId) {
    return;
  }

  try {
    await client.query('UPDATE "User" SET "userGroupId" = $1 WHERE id = $2', [PRE_REGISTERED_GROUP_ID, dbUser.id]);
    await logAudit('AUDIT', `User '${profile.name || profile.email}' assigned to Pre-Registered User group via Azure AD SSO (existing user).`, 'Auth:SignIn', dbUser.id);
  } catch (groupError) {
    console.error('[AZURE AD SIGNIN] Error assigning user to Pre-Registered User group:', groupError);
  }
}

async function syncAzureAdProfileAttributes(
  client: DbClient,
  dbUser: AzureAdDbUser,
  profile: Record<string, unknown>,
) {
  try {
    const azureAttributes = getAzureAdProfileAttributes(profile);
    const shouldUpdate = shouldSyncAzureAdProfileAttributes(azureAttributes, dbUser);

    if (shouldUpdate) {
      await client.query(
        'UPDATE "User" SET "position_title" = COALESCE($1, "position_title"), department = COALESCE($2, department), "phone_number" = COALESCE($3, "phone_number"), "office_location" = COALESCE($4, "office_location") WHERE id = $5',
        [
          azureAttributes.jobTitle,
          azureAttributes.department,
          azureAttributes.mobilePhone,
          azureAttributes.officeLocation,
          dbUser.id,
        ],
      );
    }
  } catch (updateError) {
    console.warn('[AZURE AD SIGNIN] Failed to sync latest attributes:', updateError);
  }
}

export async function linkAzureAdAccount(
  client: DbClient,
  account: UsableAzureAdAccount,
  userId: string,
) {
  try {
    const res = await client.query('SELECT * FROM "Account" WHERE "provider" = $1 AND "providerAccountId" = $2', [account.provider, account.providerAccountId]);

    if (res.rows.length === 0) {
      await client.query(
        'INSERT INTO "Account" (id, "userId", type, provider, "providerAccountId", access_token, expires_at, scope, token_type, id_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        buildAzureAdAccountInsertValues(account, userId),
      );
      return;
    }

    const existingAccount = res.rows[0] as AzureAdAccountRow | undefined;
    if (!existingAccount) {
      return;
    }

    if (existingAccount.userId !== userId) {
      await client.query(
        'UPDATE "Account" SET "userId" = $1, access_token = $2, expires_at = $3, scope = $4, token_type = $5, id_token = $6 WHERE id = $7',
        buildAzureAdAccountUpdateValues(account, userId, existingAccount.id),
      );
    }
  } catch (accountError) {
    console.error('[AZURE AD SIGNIN] Error linking account (non-critical):', accountError);
  }
}
