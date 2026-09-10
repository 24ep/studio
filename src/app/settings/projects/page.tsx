import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { hasAnyPermission, isAdminUser } from '@/lib/permissions';
import { FinancialDimensionsClient } from '../financial-dimensions/FinancialDimensionsClient';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const canView = isAdminUser(session.user)
    || hasAnyPermission(session.user, ['SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_EDIT']);
  if (!canView) redirect('/unauthorized');

  const canEdit = isAdminUser(session.user)
    || hasAnyPermission(session.user, ['SYSTEM_SETTINGS_EDIT']);

  return <FinancialDimensionsClient canEdit={canEdit} initialResource="projects" />;
}
