import { describe, expect, it } from 'vitest';

import { SYSTEM_SETTING_KEYS } from '@/app/api/settings/system-settings/system-settings-route-keys';
import {
  POLICY_CONFIGURATION_SETTING_KEYS,
  getPolicyConfigurationArea,
  policyConfigurationAreas,
} from './policy-configuration-model';

describe('policy configuration model', () => {
  it('registers every persisted policy key with the system settings API', () => {
    expect(POLICY_CONFIGURATION_SETTING_KEYS.every(key => SYSTEM_SETTING_KEYS.includes(key))).toBe(true);
  });

  it('provides a complete editable definition for every policy area', () => {
    expect(policyConfigurationAreas).toHaveLength(POLICY_CONFIGURATION_SETTING_KEYS.length);
    expect(new Set(policyConfigurationAreas.map(area => area.id)).size).toBe(policyConfigurationAreas.length);

    for (const area of policyConfigurationAreas) {
      expect(area.sections.length).toBeGreaterThan(0);
      const fields = area.sections.flatMap(section => section.fields);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.every(field => Object.hasOwn(area.defaults, field.key))).toBe(true);
    }
  });

  it('keeps subscription billing out of the local policy/settings store', () => {
    expect([...POLICY_CONFIGURATION_SETTING_KEYS] as string[]).not.toContain('billingConfiguration');
    expect([...SYSTEM_SETTING_KEYS] as string[]).not.toContain('billingConfiguration');
    expect(policyConfigurationAreas.map(area => area.id)).not.toContain('billing');
  });

  it('falls back safely when an unknown area is requested', () => {
    expect(getPolicyConfigurationArea('missing')).toBe(policyConfigurationAreas[0]);
  });
});
