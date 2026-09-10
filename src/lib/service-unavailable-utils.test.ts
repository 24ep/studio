import { describe, expect, it } from 'vitest';

import {
  isPageLoadRequest,
  isServiceUnavailableError,
} from './service-unavailable-utils';

describe('service unavailable utilities', () => {
  it('recognizes a numeric 503 status', () => {
    expect(isServiceUnavailableError({ status: 503, message: 'Request failed' })).toBe(true);
    expect(isServiceUnavailableError({ statusCode: '503' })).toBe(true);
  });

  it('recognizes common 503 messages', () => {
    expect(isServiceUnavailableError(new Error('HTTP 503: Unavailable'))).toBe(true);
    expect(isServiceUnavailableError(new Error('Storage service unavailable'))).toBe(true);
  });

  it('does not classify unrelated errors as 503 errors', () => {
    expect(isServiceUnavailableError(new Error('Applicant unavailable'))).toBe(false);
    expect(isServiceUnavailableError({ status: 500, message: 'Server error' })).toBe(false);
  });

  it('treats GET and HEAD page routes as page-loading requests', () => {
    expect(isPageLoadRequest('/people/assets')).toBe(true);
    expect(isPageLoadRequest('/people/assets', { method: 'HEAD' })).toBe(true);
    expect(isPageLoadRequest('/people/assets', { method: 'POST' })).toBe(false);
  });

  it('does not treat API reads as page-loading requests', () => {
    expect(isPageLoadRequest('/api/hr/v1/assignments')).toBe(false);
    expect(isPageLoadRequest('/api/payroll/workspace/overview')).toBe(false);
    expect(isPageLoadRequest('/api/expenses/claims?scope=self')).toBe(false);
    expect(isPageLoadRequest('https://example.com/api/employees?active=true')).toBe(false);
    expect(isPageLoadRequest('/api/employees', { method: 'HEAD' })).toBe(false);
  });
});
