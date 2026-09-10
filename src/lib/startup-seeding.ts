import { execSync } from 'child_process';

import { getStartupErrorMessage } from './startup-service-checks';
import type { StartupResult } from './startup-types';

export function seedApplicationDatabase(): StartupResult['seeding'] {
  try {
    execSync('npm run seed', { stdio: 'pipe' });
    return {
      status: 'success',
      message: 'Database seeded successfully',
    };
  } catch (error) {
    console.error('Database seeding failed:', error);
    return {
      status: 'error',
      message: 'Failed to seed database',
      error: getStartupErrorMessage(error),
    };
  }
}

export function seedPrismaDatabase(): boolean {
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to seed database:', error);
    return false;
  }
}
