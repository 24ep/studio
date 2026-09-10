import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  collectCriticalEnvErrors,
  isSecureSecret,
  validateCriticalEnvVars,
  validateNextAuthSecret,
  validateNextAuthUrl,
} from './envValidation';

const ORIGINAL_ENV = process.env;

function setEnv(overrides: Partial<NodeJS.ProcessEnv>) {
  process.env = { ...ORIGINAL_ENV, ...overrides };
}

describe('environment validation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it('validates NextAuth secrets and warns for short non-placeholder values', () => {
    setEnv({ NEXTAUTH_SECRET: 'secret' });
    expect(() => validateNextAuthSecret()).toThrow('placeholder/default value');

    setEnv({ NEXTAUTH_SECRET: 'short-but-custom' });
    expect(() => validateNextAuthSecret()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('shorter than recommended'));

    setEnv({ NEXTAUTH_SECRET: 'a'.repeat(32) });
    expect(() => validateNextAuthSecret()).not.toThrow();
  });

  it('validates production NextAuth URLs and allows development warnings', () => {
    setEnv({ NODE_ENV: 'development', NEXTAUTH_URL: undefined });
    expect(() => validateNextAuthUrl()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('NEXTAUTH_URL is not set'));

    setEnv({ NODE_ENV: 'production', NEXTAUTH_URL: 'ftp://example.com' });
    expect(() => validateNextAuthUrl()).toThrow('must use http:// or https:// protocol');

    setEnv({ NODE_ENV: 'production', NEXTAUTH_URL: 'https://studio.example.com' });
    expect(() => validateNextAuthUrl()).not.toThrow();
  });

  it('collects production environment errors without throwing', () => {
    expect(collectCriticalEnvErrors({
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: 'secret',
      NEXTAUTH_URL: 'https://yourdomain.com',
      DATABASE_URL: 'postgres://localhost/app',
    })).toEqual(expect.arrayContaining([
      expect.stringContaining('placeholder/default value'),
      expect.stringContaining('NEXTAUTH_URL contains placeholder values'),
      expect.stringContaining('DATABASE_URL appears to contain placeholder values'),
    ]));
  });

  it('throws in production but only logs in development for critical validation', () => {
    setEnv({
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: undefined,
      NEXTAUTH_URL: undefined,
      DATABASE_URL: undefined,
    });
    expect(() => validateCriticalEnvVars()).toThrow('Environment Variable Validation Failed');

    setEnv({
      NODE_ENV: 'development',
      NEXTAUTH_SECRET: undefined,
      NEXTAUTH_URL: undefined,
      DATABASE_URL: undefined,
    });
    expect(() => validateCriticalEnvVars()).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('SECURITY WARNINGS'));
  });

  it('checks secure secret patterns', () => {
    expect(isSecureSecret('a'.repeat(32))).toBe(true);
    expect(isSecureSecret('your-secret-value-that-is-long-enough')).toBe(false);
    expect(isSecureSecret('short')).toBe(false);
  });
});
