import { describe, expect, it } from 'vitest';

import {
  convertFieldsToTypes,
  convertStringBooleansAndNumbers,
  normalizePayloadTypes,
} from './api-payload-normalization';

describe('api payload normalization', () => {
  it('converts string booleans and numeric strings recursively', () => {
    expect(convertStringBooleansAndNumbers({
      active: 'true',
      nested: { count: '42', ratio: '1.5', empty: '' },
      list: ['false', '7'],
    })).toEqual({
      active: true,
      nested: { count: 42, ratio: 1.5, empty: '' },
      list: [false, 7],
    });
  });

  it('normalizes payload types recursively while preserving nonnumeric strings', () => {
    expect(normalizePayloadTypes({
      enabled: 'false',
      amount: '12.25',
      label: 'ENG-001',
      list: ['3', 'name'],
    })).toEqual({
      enabled: false,
      amount: 12.25,
      label: 'ENG-001',
      list: [3, 'name'],
    });
  });

  it('stringifies applicant-specific fields and normalizes skill arrays', () => {
    expect(convertFieldsToTypes({
      firstname: 123,
      skill: ['React', 42],
      nested: { GPA: 3.5, unchanged: 10 },
    })).toEqual({
      firstname: '123',
      skill: ['React', '42'],
      nested: { GPA: '3.5', unchanged: 10 },
    });
  });
});
