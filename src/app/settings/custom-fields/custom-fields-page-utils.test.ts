import { describe, expect, it } from 'vitest';
import {
  canManageCustomFieldDefinitions,
  getCustomFieldSubmitTarget,
  getCustomFieldSuccessMessage,
} from './custom-fields-page-utils';
import type { CustomFieldDefinition } from '@/lib/types';

describe('custom-fields-page-utils', () => {
  it('checks custom field management permissions', () => {
    expect(canManageCustomFieldDefinitions({ role: 'Admin' })).toBe(true);
    expect(canManageCustomFieldDefinitions({ modulePermissions: ['CUSTOM_FIELDS_EDIT'] })).toBe(true);
    expect(canManageCustomFieldDefinitions({ role: 'Recruiter', modulePermissions: [] })).toBe(false);
    expect(canManageCustomFieldDefinitions(null)).toBe(false);
  });

  it('builds create and edit submit targets', () => {
    expect(getCustomFieldSubmitTarget(null)).toEqual({
      method: 'POST',
      url: '/api/settings/custom-field-definitions',
      action: 'create',
    });
    expect(getCustomFieldSubmitTarget({ id: 'field-1' } as CustomFieldDefinition)).toEqual({
      method: 'PUT',
      url: '/api/settings/custom-field-definitions?id=field-1',
      action: 'update',
    });
  });

  it('builds success messages with response labels when present', () => {
    expect(getCustomFieldSuccessMessage({
      fallbackLabel: 'Fallback',
      isEditing: false,
      result: { label: 'Preferred' },
    })).toBe('Definition "Preferred" was successfully created.');
    expect(getCustomFieldSuccessMessage({
      fallbackLabel: 'Fallback',
      isEditing: true,
      result: {},
    })).toBe('Definition "Fallback" was successfully updated.');
  });
});
