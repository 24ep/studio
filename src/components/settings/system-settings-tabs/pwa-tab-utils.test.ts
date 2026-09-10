import { describe, expect, it } from 'vitest';

import { PWA_COLOR_FIELDS, PWA_STATUS_BAR_OPTIONS, PWA_TEXT_FIELDS } from './pwa-tab-utils';

describe('PWA tab utilities', () => {
  it('defines one unique control per manifest field', () => {
    const allIds = [
      ...PWA_TEXT_FIELDS.map((field) => field.id),
      ...PWA_COLOR_FIELDS.map((field) => field.id),
      'pwa-apple-status-bar'
    ];

    expect(new Set(allIds).size).toBe(allIds.length);
    expect(PWA_STATUS_BAR_OPTIONS.map((option) => option.value)).toEqual([
      'default',
      'black',
      'black-translucent'
    ]);
  });
});
