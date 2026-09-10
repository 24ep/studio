export const WEB_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const MOBILE_SESSION_MAX_AGE_SECONDS = 3 * 60 * 60;

export interface AzureAdSettings {
  clientId?: string | null;
  clientSecret?: string | null;
  tenantId?: string | null;
}

const PLACEHOLDER_AZURE_AD_SETTINGS = {
  clientId: 'your_azure_ad_application_client_id',
  clientSecret: 'your_azure_ad_client_secret_value',
  tenantId: 'your_azure_ad_directory_tenant_id',
};

const AZURE_AD_SETTING_KEYS = ['clientId', 'clientSecret', 'tenantId'] as const;
const AZURE_AD_PROFILE_STRING_FIELDS = ['jobTitle', 'department', 'officeLocation'] as const;

export function maskEmail(email: string | undefined | null): string {
  if (!email || email.indexOf('@') === -1) return '[unknown]';

  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);

  return `${maskedLocal}@${domain}`;
}

export function isAzureAdSettingsConfigured(settings: AzureAdSettings) {
  return AZURE_AD_SETTING_KEYS.every((key) => {
    const value = settings[key];
    return Boolean(value && value !== PLACEHOLDER_AZURE_AD_SETTINGS[key]);
  });
}

export function detectMobileUserAgent(userAgent: string | undefined | null) {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test((userAgent || '').toLowerCase());
}

export function getSessionMaxAgeSeconds(isMobile: boolean) {
  return isMobile ? MOBILE_SESSION_MAX_AGE_SECONDS : WEB_SESSION_MAX_AGE_SECONDS;
}

export function isAdminRole(role: unknown) {
  if (typeof role !== 'string') {
    return false;
  }

  return role.toLowerCase().includes('admin');
}

export function canUpdateImpersonationContext(token: Record<string, unknown>) {
  return isAdminRole(token.role) || Boolean(token.adminId);
}

export function applyImpersonationTokenUpdate(
  token: Record<string, unknown>,
  session: Record<string, unknown> | undefined
) {
  if (!session) {
    return token;
  }

  if (session.impersonatedUserId !== undefined) {
    token.impersonatedUserId = session.impersonatedUserId;
    token.adminId = session.impersonatedUserId
      ? token.id
      : (session.impersonatedRole ? token.id : undefined);
  }

  if (session.impersonatedRole !== undefined) {
    token.impersonatedRole = session.impersonatedRole;
    token.adminId = session.impersonatedRole
      ? token.id
      : (session.impersonatedUserId ? token.id : undefined);
  }

  return token;
}

export function buildInactiveSession<TSession extends { user?: Record<string, unknown> }>(session: TSession) {
  return {
    ...session,
    user: {
      ...session.user,
      id: '',
      role: 'Recruiter',
      modulePermissions: [],
      avatarUrl: null,
      personalColor: null,
    },
  };
}

export function hydrateSessionUserFromDb(
  sessionUser: Record<string, unknown>,
  dbUser: Record<string, unknown>
) {
  for (const field of ['id', 'name', 'role', 'avatarUrl', 'personalColor', 'twoFactorEnabled']) {
    sessionUser[field] = dbUser[field];
  }

  sessionUser.twoFactorMethod = dbUser.twoFactorMethod || undefined;
  sessionUser.modulePermissions = dbUser.modulePermissions || [];
}

export interface AzureAdProfileAttributes {
  jobTitle: string | null;
  department: string | null;
  mobilePhone: string | null;
  officeLocation: string | null;
}

function getNonEmptyString(value: unknown) {
  return typeof value === 'string' && value ? value : null;
}

export function getAzureAdProfileAttributes(profile: Record<string, unknown>): AzureAdProfileAttributes {
  const businessPhones = Array.isArray(profile.businessPhones) ? profile.businessPhones : [];
  const stringAttributes = Object.fromEntries(
    AZURE_AD_PROFILE_STRING_FIELDS.map((field) => [field, getNonEmptyString(profile[field])])
  ) as Pick<AzureAdProfileAttributes, typeof AZURE_AD_PROFILE_STRING_FIELDS[number]>;

  return {
    ...stringAttributes,
    mobilePhone: getNonEmptyString(profile.mobilePhone) ?? getNonEmptyString(businessPhones[0]),
  };
}

export function shouldSyncAzureAdProfileAttributes(
  attributes: AzureAdProfileAttributes,
  dbUser: Record<string, unknown>
) {
  const dbFieldByAttribute: Record<keyof AzureAdProfileAttributes, string> = {
    jobTitle: 'position_title',
    department: 'department',
    mobilePhone: 'phone_number',
    officeLocation: 'office_location',
  };

  return Object.entries(dbFieldByAttribute).some(([attributeKey, dbField]) => {
    const value = attributes[attributeKey as keyof AzureAdProfileAttributes];
    return Boolean(value && value !== dbUser[dbField]);
  });
}
