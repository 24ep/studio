// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { authOptions } from '@/lib/auth';
import { CandidateQueueProvider } from "@/components/candidates/CandidateImportUploadQueue";
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function CandidatesPageServer() {
  // Remove build-time database calls and session fetching
  // Let the client handle data fetching
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading candidates...</div>}>
        <CandidateQueueProvider>
          <CandidatesPageClient
            initialCandidates={[]}
            initialAvailablePositions={[]}
            initialAvailableStages={[]}
            initialFetchError={undefined}
          />
        </CandidateQueueProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
