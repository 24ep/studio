import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { OffboardingPage } from '@/components/hr/OffboardingPage';
import { hasPermission } from '@/lib/permissions';

export default async function PeopleOffboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'HR_PEOPLE_MANAGE')) redirect('/unauthorized');
  return <OffboardingPage />;
}
