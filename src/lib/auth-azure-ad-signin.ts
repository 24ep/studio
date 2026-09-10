import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';

import {
  type AzureAdDbUser,
  type AzureAdSignInContext,
} from './auth-azure-ad-signin-types';
import {
  getAzureAdProfileObjectId,
  isUsableAzureAdAccount,
  isUsableAzureAdProfile,
} from './auth-azure-ad-signin-utils';
import {
  createAzureAdUser,
  linkAzureAdAccount,
  prepareExistingAzureAdUser,
} from './auth-azure-ad-user-operations';

export async function handleAzureAdSignIn({
  user,
  account,
  profile,
  isAzureAdConfigured,
}: AzureAdSignInContext) {
  if (!isAzureAdConfigured || !isUsableAzureAdAccount(account) || !isUsableAzureAdProfile(profile)) {
    return true;
  }

  const client = await getPool().connect();
  try {
    const oid = getAzureAdProfileObjectId(profile);
    const picture = profile.picture ?? null;

    if (!profile.email) {
      console.error('[AZURE AD SIGNIN] Missing email in profile:', profile);
      await logAudit('ERROR', `Azure AD sign-in failed: Missing email in profile for user ${profile.name || 'Unknown'}.`, 'Auth:SignIn', null);
      return false;
    }

    if (!oid) {
      console.error('[AZURE AD SIGNIN] Missing OID in profile:', profile);
      await logAudit('ERROR', `Azure AD sign-in failed: Missing OID in profile for user ${profile.email}.`, 'Auth:SignIn', null);
      return false;
    }

    const res = await client.query('SELECT * FROM "User" WHERE email = $1 OR "azure_oid" = $2', [profile.email, oid]);
    let dbUser = res.rows[0] as AzureAdDbUser | null | undefined;

    if (!dbUser) {
      dbUser = await createAzureAdUser(client, profile, oid, picture);
      if (!dbUser) {
        return false;
      }
    } else {
      const canSignIn = await prepareExistingAzureAdUser(client, dbUser, profile);
      if (!canSignIn) {
        return false;
      }
    }

    const userId = dbUser.id;
    await linkAzureAdAccount(client, account, userId);

    if (user) {
      user.id = userId;
    }

    return true;
  } catch (err) {
    console.error('[AZURE AD SIGNIN] Critical error during Azure AD sign-in DB operations:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error('[AZURE AD SIGNIN] Error stack:', errorStack);

    try {
      await logAudit('ERROR', `Azure AD sign-in failed: Critical database error for ${profile?.email || 'unknown user'}. Error: ${errorMessage}`, 'Auth:SignIn', null);
    } catch (logError) {
      console.error('[AZURE AD SIGNIN] Failed to log audit entry:', logError);
    }

    return false;
  } finally {
    client.release();
  }
}
