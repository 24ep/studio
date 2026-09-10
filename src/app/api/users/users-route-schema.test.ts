import { describe, expect, it } from 'vitest';

import { createUserSchema } from './users-route-schema';

describe('createUserSchema', () => {
  it('treats blank optional create fields as absent', () => {
    const result = createUserSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: '',
      role: '',
      authenticationMethods: ['azure_ad'],
      personalColor: '',
      positionTitle: '',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.password).toBeUndefined();
    expect(result.data.role).toBeUndefined();
    expect(result.data.personalColor).toBe('#3B82F6');
    expect(result.data.positionTitle).toBeUndefined();
  });

  it('still requires a valid password when one is provided', () => {
    const result = createUserSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });
});
