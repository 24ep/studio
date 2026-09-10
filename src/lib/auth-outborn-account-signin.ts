import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { loadOutbornAccountAuthorization, normalizeHriveAccountRole } from '@/lib/auth-outborn-account-authorization';
import type { SignInCallbackInput } from './auth-callback-types';

const PRE_REGISTERED_GROUP_ID = '00000000-0000-0000-0000-000000000004';
const OUTBORN_AUTH_METHOD = 'outborn_account';
function stringClaim(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }

export async function handleOutbornAccountSignIn({ user, account, profile }: SignInCallbackInput) {
  if (account?.provider !== 'outborn-account') return true;
  const profileRecord = profile as unknown as Record<string, unknown> | null | undefined;
  const email = (stringClaim(profileRecord?.email) || stringClaim(user?.email)).toLowerCase();
  const subject = stringClaim(profileRecord?.sub) || stringClaim(user?.id);
  const displayName = stringClaim(profileRecord?.name) || stringClaim(user?.name) || email.split('@')[0] || 'Obsi People user';
  const image = stringClaim(profileRecord?.picture) || stringClaim(user?.image) || null;
  if (!email || !subject) {
    await logAudit('ERROR', 'Outborn Account sign-in failed: missing subject or email.', 'Auth:SignIn', null);
    return false;
  }

  let accountAuthorization: Awaited<ReturnType<typeof loadOutbornAccountAuthorization>> = null;
  if (typeof account.access_token === 'string' && account.access_token) {
    try { accountAuthorization = await loadOutbornAccountAuthorization(account.access_token); }
    catch (error) {
      console.warn('[OUTBORN ACCOUNT SIGNIN] Account authorization context could not be loaded; preserving product-specific fallback:', error instanceof Error ? error.message : error);
    }
  }

  const client = await getPool().connect();
  try {
    const existingResult = await client.query<{ id: string; role: string | null; is_active: boolean; authentication_methods: string[] | null }>(
      'SELECT id, role, "is_active", "authentication_methods" FROM "User" WHERE lower(email) = lower($1) LIMIT 1', [email],
    );
    let dbUser = existingResult.rows[0];
    const effectiveRole = accountAuthorization?.role ?? normalizeHriveAccountRole(dbUser?.role || 'employee');
    if (!dbUser) {
      const userId = crypto.randomUUID();
      const placeholderPassword = await bcrypt.hash(`outborn-account-${crypto.randomBytes(32).toString('base64url')}`, 12);
      const created = await client.query<{ id: string; role: string | null; is_active: boolean; authentication_methods: string[] | null }>(
        `INSERT INTO "User" (id, name, email, password, role, image, "authentication_methods", "userGroupId", "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$7]::text[], $8, NOW(), NOW(), NOW())
         RETURNING id, role, "is_active", "authentication_methods"`,
        [userId, displayName, email, placeholderPassword, effectiveRole, image, OUTBORN_AUTH_METHOD, PRE_REGISTERED_GROUP_ID],
      );
      dbUser = created.rows[0];
      if (!dbUser) return false;
      await logAudit('AUDIT', `New user '${displayName}' created via Outborn Account.`, 'Auth:SignIn', dbUser.id);
    } else {
      const wasLocallyInactive = dbUser.is_active === false;
      await client.query(
        `UPDATE "User" SET name = CASE WHEN $1 <> '' THEN $1 ELSE name END, image = COALESCE($2, image), role = $3, "is_active" = TRUE,
          "authentication_methods" = CASE WHEN $4 = ANY(COALESCE("authentication_methods", ARRAY[]::text[])) THEN COALESCE("authentication_methods", ARRAY[]::text[]) ELSE array_append(COALESCE("authentication_methods", ARRAY[]::text[]), $4) END,
          "userGroupId" = COALESCE("userGroupId", $5), "updatedAt" = NOW() WHERE id = $6`,
        [displayName, image, effectiveRole, OUTBORN_AUTH_METHOD, PRE_REGISTERED_GROUP_ID, dbUser.id],
      );
      dbUser = { ...dbUser, role: effectiveRole, is_active: true };
      if (wasLocallyInactive) {
        await logAudit('AUDIT', `User '${email}' local shadow status reactivated from authoritative Outborn Account access.`, 'Auth:SignIn', dbUser.id);
      }
    }
    user.id = dbUser.id;
    user.role = effectiveRole;
    user.modulePermissions = accountAuthorization?.modulePermissions ?? [];
    await logAudit('AUDIT', `User '${email}' signed in via Outborn Account with role '${effectiveRole}'.`, 'Auth:SignIn', dbUser.id);
    return true;
  } catch (error) {
    console.error('[OUTBORN ACCOUNT SIGNIN] Failed to map Account identity to Obsi People user:', error);
    try { await logAudit('ERROR', `Outborn Account sign-in failed for ${email || 'unknown user'}: ${error instanceof Error ? error.message : String(error)}`, 'Auth:SignIn', null); } catch {}
    return false;
  } finally { client.release(); }
}
