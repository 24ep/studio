import { getSystemSetting } from '@/lib/systemSettings';

export async function isDemoInstallation() {
  if (!process.env.DATABASE_URL) return false;
  return (await getSystemSetting('installationEnvironment')) === 'demo';
}

export const DEMO_EXTERNAL_ACTION_ERROR = 'External delivery is disabled in the Demo environment.';
