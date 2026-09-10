import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { BranchConfigClient } from './BranchConfigClient';

export default async function BranchConfigPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');

  return <BranchConfigClient />;
}
