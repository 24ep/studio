// src/app/positions/page.tsx (Server Component)
import { Suspense } from 'react';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function PositionsPageServer() {
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
