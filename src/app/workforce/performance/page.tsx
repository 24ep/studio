import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PerformanceWorkspace } from '@/components/performance/PerformanceWorkspace';
import { canAccessPerformanceManagement } from '@/lib/performance/performance-service';

export default async function WorkforcePerformancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  if (!await canAccessPerformanceManagement(session.user)) redirect('/ess/performance');

  return <PerformanceWorkspace />;
}
