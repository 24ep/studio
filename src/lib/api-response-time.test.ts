import { describe, expect, it } from 'vitest';

import { formatResponseTime, getElapsedMilliseconds } from './api-response-time';

describe('api-response-time', () => {
  it('calculates elapsed milliseconds from the supplied start time', () => {
    expect(getElapsedMilliseconds(100, 145)).toBe(45);
    expect(formatResponseTime(100, 145)).toBe('45ms');
  });

  it('guards against negative elapsed values when clocks move backwards', () => {
    expect(getElapsedMilliseconds(200, 150)).toBe(0);
    expect(formatResponseTime(200, 150)).toBe('0ms');
  });
});
