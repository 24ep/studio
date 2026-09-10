import { describe, expect, it } from 'vitest';

import { firstAdminSetupSchema, installationEnvironmentSchema } from './platform-installation';

describe('first admin setup input', () => {
  it('normalizes a valid first admin account', () => {
    const result = firstAdminSetupSchema.parse({
      name: '  Nara Admin  ',
      email: 'NARA@EXAMPLE.COM',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    });

    expect(result.name).toBe('Nara Admin');
    expect(result.email).toBe('nara@example.com');
  });

  it('rejects mismatched passwords', () => {
    const result = firstAdminSetupSchema.safeParse({
      name: 'Nara Admin',
      email: 'nara@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.success).toBe(false);
  });
});

describe('installation environment input', () => {
  it('accepts production without demo options', () => {
    expect(installationEnvironmentSchema.parse({ environment: 'production' })).toEqual({ environment: 'production' });
  });

  it('accepts the maximum realistic demo profile', () => {
    expect(installationEnvironmentSchema.parse({ environment: 'demo', employeeCount: 1000, historyMonths: 24 }))
      .toMatchObject({ employeeCount: 1000, historyMonths: 24 });
  });

  it('rejects demo profiles beyond the supported limits', () => {
    expect(installationEnvironmentSchema.safeParse({ environment: 'demo', employeeCount: 1001, historyMonths: 25 }).success).toBe(false);
  });
});
