import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { EmployeeUnifiedTimeline } from '@/components/hr/EmployeeUnifiedTimeline';
import { getEmployeeForUser } from '@/lib/hr/ess-service';
import { hasAnyPermission } from '@/lib/permissions';

interface EmployeeTimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeTimelinePage({ params }: EmployeeTimelinePageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect('/people');

  if (!hasAnyPermission(session.user, ['HR_PEOPLE_VIEW', 'HR_PEOPLE_MANAGE'])) {
    const ownEmployee = await getEmployeeForUser(session.user.id, session.user.email);
    if (ownEmployee?.id !== id) redirect('/unauthorized');
  }

  return <EmployeeUnifiedTimeline employeeId={id} />;
}
