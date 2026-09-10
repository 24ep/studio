import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  buildResponsiveTableHeightStyle,
  getResponsiveTableHeightClass,
  toResponsiveTableDisplayValue,
} from './responsive-table-utils';

describe('responsive table utilities', () => {
  it('normalizes table display values', () => {
    expect(toResponsiveTableDisplayValue(null)).toBeNull();
    expect(toResponsiveTableDisplayValue('name')).toBe('name');
    expect(toResponsiveTableDisplayValue({ a: 1 })).toBe('{"a":1}');

    const element = React.createElement('span', null, 'value');
    expect(toResponsiveTableDisplayValue(element)).toBe(element);
  });

  it('maps height modes and custom heights', () => {
    expect(getResponsiveTableHeightClass('auto')).toBe('table-height-auto');
    expect(getResponsiveTableHeightClass('responsive')).toBe('table-container-responsive');
    expect(buildResponsiveTableHeightStyle()).toEqual({});
    expect(buildResponsiveTableHeightStyle(320)).toEqual({ height: '320px' });
    expect(buildResponsiveTableHeightStyle('50vh')).toEqual({ height: '50vh' });
  });
});
