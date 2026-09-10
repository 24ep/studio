import { createHash, randomBytes, randomUUID } from 'crypto';

import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import {
  buildEmployeeEmailCandidate,
  buildEmployeeEmailLocalPart,
  normalizeEmployeeEmailDomain,
} from '@/lib/employee-email-address';
import { parseOrganizationProfile } from '@/lib/organization-profile';

export const EMPLOYEE_ROLE_ID = '00000000-0000-0000-0000-000000000005';
export const EMPLOYEE_ROLE_NAME = 'Employee';
export const EMPLOYEE_ROLE_PERMISSIONS = ['USER_PREFERENCES_MANAGE_OWN'] as const;
export const PASSWORD_SETUP_TOKEN_LIFETIME_HOURS = 48;
export const MIN_PASSWORD_SETUP_TOKEN_LIFETIME_HOURS = 1;
export const MAX_PASSWORD_SETUP_TOKEN_LIFETIME_HOURS = 720;

export type QueryClient = {
  query<Row = unknown>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: Row[]; rowCount?: number | null }>;
};

export type EmployeeAccountSource = {
  employeeId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  /** Existing reachable address used to deliver setup instructions. */
  deliveryEmail?: string | null;
};

export type PasswordSetupInvitation = {
  employeeName: string;
  deliveryEmail: string;
  loginEmail: string;
  rawToken: string;
  expiresAt: Date;
};

export type EmployeeAccountProvisionResult = {
  accountCreated: boolean;
  loginEmail: string;
  userId: string;
  invitation: PasswordSetupInvitation | null;
};

type EmployeeUserRow = {
  userId: string | null;
  email: string | null;
  forcePasswordChange: boolean | null;
};

type EmployeeRoleRow = {
  id: string;
};

type ExistingAddressRow = {
  exists: boolean;
};

type UserInsertRow = {
  id: string;
  email: string;
};

type OrganizationSettingRow = {
  value: string | null;
};

export function parsePasswordSetupTokenLifetimeHours(value: string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PASSWORD_SETUP_TOKEN_LIFETIME_HOURS;
  return Math.min(
    MAX_PASSWORD_SETUP_TOKEN_LIFETIME_HOURS,
    Math.max(MIN_PASSWORD_SETUP_TOKEN_LIFETIME_HOURS, Math.round(parsed)),
  );
}

export class EmployeeAccountConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmployeeAccountConfigurationError';
  }
}

export function hashPasswordSetupToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function prismaTransactionQueryClient(tx: Prisma.TransactionClient): QueryClient {
  return {
    async query<Row>(sql: string, params: readonly unknown[] = []) {
      const rows = await tx.$queryRawUnsafe<Row[]>(sql, ...params);
      return { rows, rowCount: rows.length };
    },
  };
}

export async function getConfiguredEmployeeEmailDomain(client: QueryClient): Promise<string> {
  const result = await client.query<OrganizationSettingRow>(
    `SELECT value
     FROM "SystemSetting"
     WHERE key = 'organizationProfile'
     LIMIT 1`,
  );
  const profile = parseOrganizationProfile(result.rows[0]?.value);
  const domain = normalizeEmployeeEmailDomain(profile.employeeEmailDomain);

  if (!domain) {
    throw new EmployeeAccountConfigurationError(
      'Configure a valid Company Email Domain in Admin Center > HR Setup > Company Info before creating an employee.',
    );
  }

  return domain;
}

async function ensureEmployeeRole(client: QueryClient): Promise<string> {
  const result = await client.query<EmployeeRoleRow>(
    `INSERT INTO "UserGroup" (
       id, name, description, permissions, "is_default", "is_system_role", "createdAt", "updatedAt"
     )
     VALUES ($1::uuid, $2, $3, $4::text[], false, true, NOW(), NOW())
     ON CONFLICT (name) DO UPDATE
     SET "is_system_role" = true,
         "updatedAt" = NOW()
     RETURNING id`,
    [
      EMPLOYEE_ROLE_ID,
      EMPLOYEE_ROLE_NAME,
      'Employee self-service access',
      [...EMPLOYEE_ROLE_PERMISSIONS],
    ],
  );

  const roleId = result.rows[0]?.id;
  if (!roleId) {
    throw new Error('Unable to create or resolve the Employee role.');
  }
  return roleId;
}

async function findAvailableEmployeeEmail(
  client: QueryClient,
  source: EmployeeAccountSource,
  domain: string,
): Promise<string> {
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtext('employee_account_email'))::text AS locked`,
  );
  const localPart = buildEmployeeEmailLocalPart(
    source.firstName,
    source.lastName,
    source.employeeNumber,
  );

  for (let sequence = 1; sequence <= 9999; sequence += 1) {
    const candidate = buildEmployeeEmailCandidate(localPart, domain, sequence);
    const existing = await client.query<ExistingAddressRow>(
      `SELECT EXISTS (
         SELECT 1 FROM "User" WHERE lower(email) = lower($1)
         UNION ALL
         SELECT 1 FROM hr_employees WHERE lower(email) = lower($1) AND id <> $2::uuid
       ) AS "exists"`,
      [candidate, source.employeeId],
    );

    if (!existing.rows[0]?.exists) return candidate;
  }

  throw new Error('Unable to generate a unique employee email address.');
}

async function issuePasswordSetupInvitation(
  client: QueryClient,
  userId: string,
  source: EmployeeAccountSource,
  loginEmail: string,
): Promise<PasswordSetupInvitation> {
  const lifetimeSetting = await client.query<OrganizationSettingRow>(
    `SELECT value FROM "SystemSetting" WHERE key = 'passwordSetupLinkExpiryHours' LIMIT 1`,
  );
  const lifetimeHours = parsePasswordSetupTokenLifetimeHours(lifetimeSetting.rows[0]?.value);
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashPasswordSetupToken(rawToken);
  const expiresAt = new Date(
    Date.now() + lifetimeHours * 60 * 60 * 1000,
  );

  await client.query(
    `UPDATE password_setup_tokens
     SET used_at = NOW()
     WHERE user_id = $1::uuid
       AND used_at IS NULL
     RETURNING id`,
    [userId],
  );
  await client.query(
    `INSERT INTO password_setup_tokens (
       id, user_id, token_hash, expires_at, created_at
     )
     VALUES ($1::uuid, $2::uuid, $3, $4, NOW())
     RETURNING id`,
    [randomUUID(), userId, tokenHash, expiresAt],
  );

  return {
    employeeName: `${source.firstName} ${source.lastName}`.trim(),
    deliveryEmail: source.deliveryEmail?.trim() || loginEmail,
    loginEmail,
    rawToken,
    expiresAt,
  };
}

export async function provisionEmployeePlatformAccount(
  client: QueryClient,
  source: EmployeeAccountSource,
  configuredDomain?: string,
): Promise<EmployeeAccountProvisionResult> {
  const employeeResult = await client.query<EmployeeUserRow>(
    `SELECT
       e.user_id AS "userId",
       u.email,
       u.force_password_change AS "forcePasswordChange"
     FROM hr_employees e
     LEFT JOIN "User" u ON u.id = e.user_id
     WHERE e.id = $1::uuid
     LIMIT 1`,
    [source.employeeId],
  );
  const existing = employeeResult.rows[0];
  if (!existing) {
    throw new Error('Employee was not found while creating the platform account.');
  }

  if (existing.userId && existing.email) {
    const invitation = existing.forcePasswordChange
      ? await issuePasswordSetupInvitation(client, existing.userId, source, existing.email)
      : null;
    return {
      accountCreated: false,
      loginEmail: existing.email,
      userId: existing.userId,
      invitation,
    };
  }

  const domain = normalizeEmployeeEmailDomain(configuredDomain)
    || await getConfiguredEmployeeEmailDomain(client);
  const roleId = await ensureEmployeeRole(client);
  const loginEmail = await findAvailableEmployeeEmail(client, source, domain);
  const userId = randomUUID();
  const placeholderPassword = await bcrypt.hash(
    `employee-setup-${randomBytes(32).toString('hex')}`,
    10,
  );

  const insertedUser = await client.query<UserInsertRow>(
    `INSERT INTO "User" (
       id,
       name,
       email,
       password,
       role,
       "authentication_methods",
       "force_password_change",
       "is_active",
       "userGroupId",
       module_permissions,
       "position_title",
       "employee_id",
       "createdAt",
       "updatedAt"
     )
     VALUES (
       $1::uuid,
       $2,
       $3,
       $4,
       $5,
       ARRAY['basic']::text[],
       true,
       true,
       $6::uuid,
       $7::text[],
       $8,
       $9,
       NOW(),
       NOW()
     )
     RETURNING id, email`,
    [
      userId,
      `${source.firstName} ${source.lastName}`.trim(),
      loginEmail,
      placeholderPassword,
      EMPLOYEE_ROLE_NAME,
      roleId,
      [...EMPLOYEE_ROLE_PERMISSIONS],
      source.jobTitle || null,
      source.employeeNumber,
    ],
  );
  const user = insertedUser.rows[0];
  if (!user) {
    throw new Error('Platform account could not be created.');
  }

  await client.query(
    `UPDATE hr_employees
     SET user_id = $1::uuid,
         email = $2,
         updated_at = NOW()
     WHERE id = $3::uuid
     RETURNING id`,
    [user.id, user.email, source.employeeId],
  );

  const invitation = await issuePasswordSetupInvitation(
    client,
    user.id,
    source,
    user.email,
  );

  return {
    accountCreated: true,
    loginEmail: user.email,
    userId: user.id,
    invitation,
  };
}
