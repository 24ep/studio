// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { authOptions } from '@/lib/auth';
import { CandidateQueueProvider } from "@/components/candidates/CandidateImportUploadQueue";

export default async function CandidatesPageServer() {
  // Remove build-time database calls and session fetching
  // Let the client handle data fetching
  
  return (
    <CandidateQueueProvider>
      <CandidatesPageClient
        initialCandidates={[]}
        initialAvailablePositions={[]}
        initialAvailableStages={[]}
        initialFetchError={undefined}
      />
    </CandidateQueueProvider>
  );
}
