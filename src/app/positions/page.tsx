import { Suspense } from 'react';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export default async function PositionsPageServer() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    redirect('/unauthorized');
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <PositionsPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
