import { describe, expect, it } from 'vitest';
import { buildV1SettingsResponse, parseStoredJson } from './settings-v1-transform';

describe('settings-v1-transform', () => {
  it('groups system settings and parses stored JSON values', () => {
    const response = buildV1SettingsResponse({
      systemSettings: [
        { category: 'email', key: 'smtpPort', value: '587' },
        { category: 'email', key: 'enabled', value: 'true' },
        { category: 'upload', key: 'allowedTypes', value: '["pdf","docx"]' },
      ],
      userPreferences: [
        { key: 'theme', value: '"dark"' },
        { key: 'timezone', value: 'UTC' },
      ],
      customFields: [
        {
          id: 'field-1',
          name: 'Location',
          type: 'select',
          isRequired: false,
          options: '["Remote","Hybrid"]',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-02',
        },
      ],
    });

    expect(response.systemSettings).toEqual({
      email: { smtpPort: 587, enabled: true },
      upload: { allowedTypes: ['pdf', 'docx'] },
    });
    expect(response.userPreferences).toEqual({ theme: 'dark', timezone: 'UTC' });
    expect(response.customFields[0]).toMatchObject({
      id: 'field-1',
      options: ['Remote', 'Hybrid'],
    });
  });

  it('falls back when stored JSON is invalid', () => {
    expect(parseStoredJson('not-json', 'fallback')).toBe('fallback');
  });
});
