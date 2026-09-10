import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { LeaveBlockListClient } from '@/app/settings/leave-block-list/LeaveBlockListClient';
import { HolidaysPageClient } from './HolidaysPageClient';

interface WorkforceHolidaysPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function WorkforceHolidaysPage({ searchParams }: WorkforceHolidaysPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!hasPermission(session.user, 'HR_WORKFORCE_VIEW')) {
    redirect('/unauthorized');
  }

  const requestedTab = (await searchParams)?.tab;
  const activeTab = requestedTab === 'leave-blocks' ? 'leave-blocks' : 'holidays';

  return (
    <div className="min-h-full text-foreground">
      {activeTab === 'leave-blocks' ? <LeaveBlockListClient /> : <HolidaysPageClient />}
    </div>
  );
}
