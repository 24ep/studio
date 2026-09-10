import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { LearningCategoriesClient } from './LearningCategoriesClient';

export default async function LearningCategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');

  return <LearningCategoriesClient canEdit={hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')} />;
}
