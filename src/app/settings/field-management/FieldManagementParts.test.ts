import { describe, expect, it } from 'vitest';

import {
  formatFieldType,
  formatSystemType,
  optionsToText,
  parseOptions,
} from './FieldManagementParts';

describe('FieldManagementParts helpers', () => {
  it('parses option lines while preserving labels with colons', () => {
    expect(parseOptions('active:Active\npaused\nexternal:External:Partner')).toEqual([
      { value: 'active', label: 'Active', sortOrder: 0, isActive: true },
      { value: 'paused', label: 'paused', sortOrder: 1, isActive: true },
      { value: 'external', label: 'External:Partner', sortOrder: 2, isActive: true },
    ]);
  });

  it('serializes option values and labels one per line', () => {
    expect(optionsToText([
      { value: 'active', label: 'Active', sortOrder: 0, isActive: true },
      { value: 'paused', label: 'Paused', sortOrder: 1, isActive: true },
    ])).toBe('active:Active\npaused:Paused');
  });

  it('formats custom and system field types consistently', () => {
    expect(formatFieldType('multi_select')).toBe('Multi Select');
    expect(formatSystemType({
      isList: true,
      isOptional: false,
      isSystem: true,
      label: 'Tags',
      name: 'tags',
      nativeType: 'String',
      type: 'text',
    })).toBe('text (String, List)');
  });
});
