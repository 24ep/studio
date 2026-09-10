import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { CompensationApprovalRoutesClient } from './CompensationApprovalRoutesClient';

export default async function CompensationApprovalRoutesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');
  return <CompensationApprovalRoutesClient canEdit={hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')} />;
}
