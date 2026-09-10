import { describe, expect, it } from 'vitest';
import {
  buildSystemStatusItems,
  canCheckSystemStatus,
  getSystemStatusBadgeVariant,
  getSystemStatusColor,
  updateSystemStatusItem,
} from './system-status-utils';

describe('system status utilities', () => {
  it('checks access for admin and system settings viewers', () => {
    expect(canCheckSystemStatus({ role: 'Admin' })).toBe(true);
    expect(canCheckSystemStatus({ modulePermissions: ['SYSTEM_SETTINGS_VIEW'] })).toBe(true);
    expect(canCheckSystemStatus({ role: 'Recruiter', modulePermissions: [] })).toBe(false);
  });

  it('maps status styling consistently', () => {
    expect(getSystemStatusColor('ok')).toBe('text-green-500');
    expect(getSystemStatusColor('disabled')).toBe('text-red-500');
    expect(getSystemStatusBadgeVariant('warning')).toBe('secondary');
  });

  it('builds and updates status items', () => {
    const items = buildSystemStatusItems(true);
    const ssoItem = items.find((item) => item.id === 'azure_ad_sso_conceptual');

    expect(ssoItem?.status).toBe('enabled');
    expect(ssoItem?.actionLabel).toBe('Conceptually Disable SSO');
    expect(updateSystemStatusItem(items, 'postgres_connection', { status: 'error' })[0].status).toBe('error');
  });
});
