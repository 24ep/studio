import { describe, expect, it } from 'vitest';

import {
  MOBILE_SESSION_MAX_AGE_SECONDS,
  WEB_SESSION_MAX_AGE_SECONDS,
  applyImpersonationTokenUpdate,
  buildInactiveSession,
  canUpdateImpersonationContext,
  detectMobileUserAgent,
  getAzureAdProfileAttributes,
  getSessionMaxAgeSeconds,
  hydrateSessionUserFromDb,
  isAdminRole,
  isAzureAdSettingsConfigured,
  maskEmail,
  shouldSyncAzureAdProfileAttributes,
} from './auth-config-utils';

describe('auth config utilities', () => {
  it('masks email addresses for logs', () => {
    expect(maskEmail('ari@example.com')).toBe('a*i@example.com');
    expect(maskEmail('al@example.com')).toBe('**@example.com');
    expect(maskEmail('invalid')).toBe('[unknown]');
    expect(maskEmail(null)).toBe('[unknown]');
  });

  it('detects configured Azure AD settings and ignores placeholders', () => {
    expect(isAzureAdSettingsConfigured({
      clientId: 'client',
      clientSecret: 'secret',
      tenantId: 'tenant',
    })).toBe(true);

    expect(isAzureAdSettingsConfigured({
      clientId: 'your_azure_ad_application_client_id',
      clientSecret: 'secret',
      tenantId: 'tenant',
    })).toBe(false);

    expect(isAzureAdSettingsConfigured({
      clientId: 'client',
      clientSecret: '',
      tenantId: 'tenant',
    })).toBe(false);
  });

  it('detects mobile user agents and resolves session lifetimes', () => {
    expect(detectMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
    expect(detectMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    expect(detectMobileUserAgent(undefined)).toBe(false);

    expect(getSessionMaxAgeSeconds(true)).toBe(MOBILE_SESSION_MAX_AGE_SECONDS);
    expect(getSessionMaxAgeSeconds(false)).toBe(WEB_SESSION_MAX_AGE_SECONDS);
  });

  it('detects admin roles and impersonation update permission', () => {
    expect(isAdminRole('Admin')).toBe(true);
    expect(isAdminRole('System Admin')).toBe(true);
    expect(isAdminRole('regional-admin')).toBe(true);
    expect(isAdminRole('Recruiter')).toBe(false);
    expect(isAdminRole(null)).toBe(false);

    expect(canUpdateImpersonationContext({ role: 'Admin' })).toBe(true);
    expect(canUpdateImpersonationContext({ adminId: 'admin-id' })).toBe(true);
    expect(canUpdateImpersonationContext({ role: 'Recruiter' })).toBe(false);
  });

  it('applies impersonation update fields to a token', () => {
    expect(applyImpersonationTokenUpdate(
      { id: 'admin-id', role: 'Admin' },
      { impersonatedUserId: 'target-id' }
    )).toEqual({
      id: 'admin-id',
      role: 'Admin',
      impersonatedUserId: 'target-id',
      adminId: 'admin-id',
    });

    expect(applyImpersonationTokenUpdate(
      { id: 'admin-id', role: 'Admin', impersonatedUserId: 'target-id' },
      { impersonatedUserId: undefined, impersonatedRole: 'Recruiter' }
    )).toEqual({
      id: 'admin-id',
      role: 'Admin',
      impersonatedUserId: 'target-id',
      impersonatedRole: 'Recruiter',
      adminId: 'admin-id',
    });
  });

  it('builds inactive and hydrated session users', () => {
    expect(buildInactiveSession({
      user: {
        id: 'user-id',
        name: 'Ari',
        role: 'Admin',
        modulePermissions: ['x'],
        avatarUrl: 'avatar.png',
        personalColor: '#000000',
      },
    })).toEqual({
      user: {
        id: '',
        name: 'Ari',
        role: 'Recruiter',
        modulePermissions: [],
        avatarUrl: null,
        personalColor: null,
      },
    });

    const sessionUser: Record<string, unknown> = {};
    hydrateSessionUserFromDb(sessionUser, {
      id: 'user-id',
      name: 'Ari',
      role: 'Admin',
      avatarUrl: 'avatar.png',
      personalColor: '#123456',
      twoFactorEnabled: true,
      twoFactorMethod: null,
      modulePermissions: ['x'],
    });

    expect(sessionUser).toEqual({
      id: 'user-id',
      name: 'Ari',
      role: 'Admin',
      avatarUrl: 'avatar.png',
      personalColor: '#123456',
      twoFactorEnabled: true,
      twoFactorMethod: undefined,
      modulePermissions: ['x'],
    });
  });

  it('normalizes Azure AD profile attributes and detects sync changes', () => {
    const attributes = getAzureAdProfileAttributes({
      jobTitle: 'Engineer',
      department: 'Product',
      businessPhones: ['+6601'],
      officeLocation: 'Bangkok',
    });

    expect(attributes).toEqual({
      jobTitle: 'Engineer',
      department: 'Product',
      mobilePhone: '+6601',
      officeLocation: 'Bangkok',
    });

    expect(getAzureAdProfileAttributes({
      mobilePhone: '+6602',
      businessPhones: ['+6601'],
    }).mobilePhone).toBe('+6602');

    expect(getAzureAdProfileAttributes({
      businessPhones: ['', '+6603'],
    }).mobilePhone).toBeNull();

    expect(shouldSyncAzureAdProfileAttributes(attributes, {
      position_title: 'Engineer',
      department: 'Product',
      phone_number: '+6601',
      office_location: 'Bangkok',
    })).toBe(false);

    expect(shouldSyncAzureAdProfileAttributes(attributes, {
      position_title: 'Old title',
      department: 'Product',
      phone_number: '+6601',
      office_location: 'Bangkok',
    })).toBe(true);

    expect(shouldSyncAzureAdProfileAttributes({
      jobTitle: null,
      department: null,
      mobilePhone: null,
      officeLocation: null,
    }, {
      position_title: 'Old title',
      department: 'Old department',
      phone_number: '+6609',
      office_location: 'Old office',
    })).toBe(false);
  });
});
