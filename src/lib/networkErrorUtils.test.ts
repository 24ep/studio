import { describe, expect, it } from 'vitest';

import {
  calculateNetworkRetryDelay,
  getApiResponseErrorMessage,
  getNetworkErrorText,
  getNetworkFailureDetails,
  getUserFriendlyNetworkErrorMessage,
  isNetworkRetryableError,
  isNonRetryableHttpStatus,
} from './networkErrorUtils';

describe('network error utilities', () => {
  it('calculates retry delays and non-retryable status flags', () => {
    expect(calculateNetworkRetryDelay(3, 250)).toBe(2000);
    expect(isNonRetryableHttpStatus(401)).toBe(true);
    expect(isNonRetryableHttpStatus(500)).toBe(false);
  });

  it('classifies retryable transient errors', () => {
    expect(isNetworkRetryableError(new Error('fetch failed'))).toBe(true);
    expect(isNetworkRetryableError({ code: 'ECONNRESET', message: 'reset' })).toBe(true);
    expect(isNetworkRetryableError({ status: 503, message: 'unavailable' })).toBe(true);
    expect(isNetworkRetryableError(new Error('deadlock detected'))).toBe(true);
    expect(isNetworkRetryableError({ status: 404, message: 'missing' })).toBe(false);
    expect(isNetworkRetryableError(null)).toBe(false);
  });

  it('builds network health failure details', () => {
    expect(getNetworkFailureDetails(new Error('fetch failed'))).toEqual({
      dnsResolution: true,
      connectionEstablished: false,
      responseReceived: false,
    });

    expect(getNetworkFailureDetails(new Error('offline'))).toEqual({
      dnsResolution: false,
      connectionEstablished: false,
      responseReceived: false,
    });
  });

  it('maps errors and response statuses to user-facing messages', () => {
    expect(getNetworkErrorText(new Error('boom'))).toBe('boom');
    expect(getUserFriendlyNetworkErrorMessage(new Error('ETIMEDOUT'))).toContain('timed out');
    expect(getUserFriendlyNetworkErrorMessage({ status: 403 })).toContain('Access denied');
    expect(getUserFriendlyNetworkErrorMessage(new Error('deadlock'))).toContain('Database conflict');

    expect(getApiResponseErrorMessage(403, 'Default')).toBe('No permission');
    expect(getApiResponseErrorMessage(418, 'Default')).toBe('Default');
  });
});
