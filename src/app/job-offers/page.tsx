import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { JobOffersPageClient } from './JobOffersPageClient';
import { hasPermission } from '@/lib/permissions';

export default async function JobOffersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!hasPermission(session.user, 'APPLICANTS_VIEW')) {
    redirect('/unauthorized');
  }

  return <JobOffersPageClient />;
}
