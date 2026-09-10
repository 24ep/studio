import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export async function requireScreeningPermission(permission: PlatformModuleId) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, permission)) return null;
  return session;
}
