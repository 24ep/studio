import { describe, expect, it } from 'vitest';

import { maskEmail, parseLockoutAlertEmails } from './auth-lockout-formatting';

describe('auth lockout alert utilities', () => {
  it('masks lockout email addresses for logs and alert subjects', () => {
    expect(maskEmail('ari@example.com')).toBe('a*i@example.com');
    expect(maskEmail('al@example.com')).toBe('**@example.com');
    expect(maskEmail('invalid')).toBe('[invalid]');
    expect(maskEmail('')).toBe('[invalid]');
  });

  it('parses lockout alert recipients from JSON arrays', () => {
    expect(parseLockoutAlertEmails('["security@example.com","ops@example.com"]')).toEqual([
      'security@example.com',
      'ops@example.com',
    ]);
  });

  it('parses and trims lockout alert recipients from comma-separated text', () => {
    expect(parseLockoutAlertEmails(' security@example.com, ,ops@example.com ')).toEqual([
      'security@example.com',
      'ops@example.com',
    ]);
  });
});
