import { describe, expect, it } from 'vitest';
import { defaultDropdownOptions, dropdownOptionCatalogDefaults, normalizeDropdownOptionCatalog } from './dropdown-option-catalog';

describe('dropdown option catalog', () => {
  it('uses unique catalog keys and option values', () => {
    expect(new Set(dropdownOptionCatalogDefaults.map(group => group.key)).size).toBe(dropdownOptionCatalogDefaults.length);
    for (const group of dropdownOptionCatalogDefaults) {
      expect(group.options.length).toBeGreaterThan(0);
      expect(new Set(group.options.map(option => option.value)).size).toBe(group.options.length);
    }
  });

  it('covers every shared business vocabulary wired into forms', () => {
    for (const key of [
      'employment_types', 'offboarding_exit_types', 'transportation_modes', 'currencies',
      'appraisal_cycle_types', 'appraisal_reviewer_relationships', 'performance_conversation_types',
      'performance_feedback_types', 'recognition_categories', 'performance_evidence_types',
      'development_activity_types', 'development_plan_types', 'pay_change_types',
      'benefit_plan_types', 'organization_types', 'organization_sizes',
    ]) expect(defaultDropdownOptions(key).length, key).toBeGreaterThan(0);
  });

  it('rejects malformed AppKit groups and normalizes option defaults', () => {
    expect(normalizeDropdownOptionCatalog([{ key: 'valid', label: 'Valid', options: [{ value: 'one', label: 'One' }] }, { key: '', label: 'Bad', options: [] }]))
      .toEqual([{ key: 'valid', label: 'Valid', description: '', options: [{ value: 'one', label: 'One', isActive: true, sortOrder: 0 }] }]);
  });
});
