import { describe, expect, it } from 'vitest';

import type { EnhancedSSEEndpointStatus } from '@/hooks/use-enhanced-sse';
import {
  formatEnhancedSseError,
  getEnhancedSseStatusColor,
  getEnhancedSseStatusText,
  getEnhancedSseSummaryCardClassNames,
} from './enhanced-sse-status-utils';

const baseEndpoint: EnhancedSSEEndpointStatus = {
  id: 'dashboard',
  name: 'Dashboard',
  url: '/api/dashboard/stream',
  enabled: true,
  isConnected: false,
  lastError: null,
  lastErrorEventType: null,
  lastErrorLocation: null,
  lastErrorTime: null,
  priority: 1,
  connectionAttempts: 0,
  retryCount: 0,
  maxRetries: 3,
  isCircuitOpen: false,
};

describe('enhanced-sse-status-utils', () => {
  it('derives status labels and classes by endpoint state', () => {
    expect(getEnhancedSseStatusText({ ...baseEndpoint, isConnected: true })).toBe('Connected');
    expect(getEnhancedSseStatusColor({ ...baseEndpoint, isConnected: true })).toContain('green');
    expect(getEnhancedSseStatusText({ ...baseEndpoint, lastError: 'Failed' })).toBe('Failed');
    expect(getEnhancedSseStatusText({ ...baseEndpoint, enabled: false })).toBe('Disabled');
    expect(getEnhancedSseStatusText(baseEndpoint)).toBe('Disconnected');
  });

  it('formats errors and summary card classes', () => {
    expect(formatEnhancedSseError('short')).toBe('short');
    expect(formatEnhancedSseError('x'.repeat(55))).toBe(`${'x'.repeat(50)}...`);
    expect(getEnhancedSseSummaryCardClassNames('blue')).toEqual({
      backgroundClassName: 'bg-blue-50 dark:bg-blue-950/40',
      textClassName: 'text-blue-600 dark:text-blue-300',
    });
  });
});
