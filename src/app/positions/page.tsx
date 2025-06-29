// src/app/positions/page.tsx (Server Component)
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import type { Position } from '@/lib/types';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function PositionsPageServer() {
  // Remove build-time database calls and session fetching
  // Let the client handle data fetching
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading positions...</div>}>
        <PositionsPageClient
          initialPositions={[]}
          initialAvailableDepartments={[]}
          initialFetchError={undefined}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
