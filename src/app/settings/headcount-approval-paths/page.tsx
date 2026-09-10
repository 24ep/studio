import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { HeadcountApprovalPathsClient } from './HeadcountApprovalPathsClient';

export default async function HeadcountApprovalPathsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');
  return <HeadcountApprovalPathsClient canEdit={hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')} />;
}
