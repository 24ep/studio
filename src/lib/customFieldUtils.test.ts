import { describe, expect, it } from 'vitest';

import type { CustomFieldDefinition } from './types';
import {
  filterCustomFieldsBySection,
  getCustomFieldBooleanValue,
  getCustomFieldDate,
  getCustomFieldSelectValue,
  getCustomFieldStringArray,
  getCustomFieldTextInputValue,
  shouldShowCustomFieldInSection,
} from './customFieldUtils';

function field(overrides: Partial<CustomFieldDefinition>): CustomFieldDefinition {
  return {
    id: overrides.id ?? 'field-id',
    model_name: overrides.model_name ?? 'Applicant',
    field_key: overrides.field_key ?? 'fieldKey',
    field_code: overrides.field_code ?? 'FIELD_CODE',
    label: overrides.label ?? 'Field',
    field_type: overrides.field_type ?? 'text',
    ...overrides,
  };
}

describe('customFieldUtils', () => {
  it('filters applicant custom fields by detail section with legacy casing support', () => {
    const fields = [
      field({ id: 'info', applicantDetailSection: 'applicant-info' }),
      field({ id: 'jobs', applicantDetailSection: 'jobs' }),
      field({ id: 'unassigned' }),
    ];

    expect(filterCustomFieldsBySection(fields, 'Applicant-info', 'Applicant').map(item => item.id))
      .toEqual(['info']);
    expect(filterCustomFieldsBySection(fields, 'applicant-info', 'Applicant').map(item => item.id))
      .toEqual(['info']);
  });

  it('applies model-specific custom field visibility rules', () => {
    expect(shouldShowCustomFieldInSection({
      field: field({ showInApplicantDetail: true, showInFullApplicantDetail: false }),
      modelName: 'Applicant',
      section: 'summary',
    })).toBe(true);

    expect(shouldShowCustomFieldInSection({
      field: field({ model_name: 'Position', positionDetailSection: 'applicants' }),
      modelName: 'Position',
      section: 'Applicants',
    })).toBe(true);

    expect(shouldShowCustomFieldInSection({
      field: field({ model_name: 'Headcount', showInHeadcountDetail: true }),
      modelName: 'Headcount',
      section: 'headcount-detail',
    })).toBe(true);

    expect(shouldShowCustomFieldInSection({
      field: field({ model_name: 'User' }),
      modelName: 'User',
      section: 'profile',
    })).toBe(true);
  });

  it('normalizes custom field input values defensively', () => {
    expect(getCustomFieldTextInputValue(['a'])).toBe('');
    expect(getCustomFieldTextInputValue(42)).toBe('42');
    expect(getCustomFieldSelectValue('selected')).toBe('selected');
    expect(getCustomFieldSelectValue(1)).toBe('');
    expect(getCustomFieldBooleanValue(true)).toBe(true);
    expect(getCustomFieldBooleanValue('true')).toBe(false);
    expect(getCustomFieldStringArray(['one', 'two'])).toEqual(['one', 'two']);
    expect(getCustomFieldStringArray('one')).toEqual([]);
  });

  it('parses valid custom field dates and rejects invalid values', () => {
    expect(getCustomFieldDate('2026-01-01')?.getFullYear()).toBe(2026);
    expect(getCustomFieldDate('not-a-date')).toBeUndefined();
    expect(getCustomFieldDate(true)).toBeUndefined();
  });
});
