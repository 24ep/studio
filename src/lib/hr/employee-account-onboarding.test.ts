import { describe, expect, it } from 'vitest';

import {
  parsePasswordSetupTokenLifetimeHours,
  provisionEmployeePlatformAccount,
  type QueryClient,
} from './employee-account-onboarding';

describe('employee platform account onboarding', () => {
  it('defaults and clamps password setup link lifetime', () => {
    expect(parsePasswordSetupTokenLifetimeHours(undefined)).toBe(48);
    expect(parsePasswordSetupTokenLifetimeHours('24')).toBe(24);
    expect(parsePasswordSetupTokenLifetimeHours('0')).toBe(1);
    expect(parsePasswordSetupTokenLifetimeHours('999')).toBe(720);
  });

  it('casts the advisory lock result to a Prisma-supported type', async () => {
    const queries: string[] = [];
    const client = {
      async query(sql: string) {
        queries.push(sql);

        if (sql.includes('LEFT JOIN "User"')) {
          return {
            rows: [{ userId: null, email: null, forcePasswordChange: null }],
          };
        }
        if (sql.includes('INSERT INTO "UserGroup"')) {
          return { rows: [{ id: '00000000-0000-0000-0000-000000000005' }] };
        }
        if (sql.includes('pg_advisory_xact_lock')) {
          return { rows: [{ locked: '' }] };
        }
        if (sql.includes('SELECT EXISTS')) {
          return { rows: [{ exists: false }] };
        }
        if (sql.includes('INSERT INTO "User"')) {
          return { rows: [{ id: 'user-id', email: 'jane.doe@example.com' }] };
        }
        if (sql.includes('UPDATE hr_employees')) {
          return { rows: [{ id: 'employee-id' }] };
        }
        if (sql.includes("passwordSetupLinkExpiryHours")) {
          return { rows: [{ value: '48' }] };
        }
        if (sql.includes('UPDATE password_setup_tokens')) {
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO password_setup_tokens')) {
          return { rows: [{ id: 'token-id' }] };
        }

        throw new Error(`Unexpected query: ${sql}`);
      },
    } as QueryClient;

    await provisionEmployeePlatformAccount(
      client,
      {
        employeeId: 'employee-id',
        employeeNumber: 'EMP-000001',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      'example.com',
    );

    const advisoryLockQuery = queries.find(sql => sql.includes('pg_advisory_xact_lock'));
    expect(advisoryLockQuery).toContain("hashtext('employee_account_email'))::text");
  });

  it('delivers the invitation to the existing reachable email address', async () => {
    const client = {
      async query(sql: string) {
        if (sql.includes('LEFT JOIN "User"')) {
          return {
            rows: [{
              userId: 'user-id',
              email: 'jane.doe@company.example',
              forcePasswordChange: true,
            }],
          };
        }
        if (sql.includes("passwordSetupLinkExpiryHours")) {
          return { rows: [{ value: '24' }] };
        }
        if (sql.includes('password_setup_tokens')) return { rows: [{ id: 'token-id' }] };
        throw new Error(`Unexpected query: ${sql}`);
      },
    } as QueryClient;

    const result = await provisionEmployeePlatformAccount(client, {
      employeeId: 'employee-id',
      employeeNumber: 'EMP-000001',
      firstName: 'Jane',
      lastName: 'Doe',
      deliveryEmail: 'jane.personal@example.com',
    });

    expect(result.invitation).toMatchObject({
      deliveryEmail: 'jane.personal@example.com',
      loginEmail: 'jane.doe@company.example',
    });
  });
});
