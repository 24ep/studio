import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import { FinancialDimensionsClient } from './FinancialDimensionsClient';

export default async function FinancialDimensionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!isAdminUser(session.user) && !hasAnyPermission(session.user, ['SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_EDIT'])) redirect('/unauthorized');
  return <FinancialDimensionsClient canEdit={isAdminUser(session.user) || hasAnyPermission(session.user, ['SYSTEM_SETTINGS_EDIT'])} />;
}

