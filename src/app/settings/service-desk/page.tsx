import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { ServiceDeskSettingsClient } from './ServiceDeskSettingsClient';

export default async function ServiceDeskSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');

  return <ServiceDeskSettingsClient canEdit={hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')} />;
}
