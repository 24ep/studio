import { describe, expect, it } from 'vitest';

import {
  getTaskFitScoreBorderClass,
  isTaskCardKeyboardActivationKey,
} from './task-card-utils';

describe('task-card-utils', () => {
  it('maps missing fit scores to the neutral border', () => {
    expect(getTaskFitScoreBorderClass()).toBe('border-l-gray-300 dark:border-l-gray-600');
    expect(getTaskFitScoreBorderClass(null)).toBe('border-l-gray-300 dark:border-l-gray-600');
  });

  it('recognizes keyboard activation keys', () => {
    expect(isTaskCardKeyboardActivationKey('Enter')).toBe(true);
    expect(isTaskCardKeyboardActivationKey(' ')).toBe(true);
    expect(isTaskCardKeyboardActivationKey('Escape')).toBe(false);
  });
});
