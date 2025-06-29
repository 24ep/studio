// src/app/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';
import type { Candidate, Position, UserProfile } from '@/lib/types';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function DashboardPageServer() {
  let session: any = null;
  let initialCandidates: Candidate[] = [];
  let initialPositions: Position[] = [];
  let initialUsers: UserProfile[] = [];
  let fetchError: string | undefined = undefined;
  let usersFetchFailed = false;

  try {
    // Only fetch session on the server side, not during build
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return <DashboardPageClient 
               initialCandidates={[]} 
               initialPositions={[]} 
               initialUsers={[]} 
               authError={true} 
             />;
    }
    
    // Move database calls to client-side or use ISR
    // For now, return empty data and let client fetch
    return <DashboardPageClient 
             initialCandidates={[]} 
             initialPositions={[]} 
             initialUsers={[]} 
             initialFetchError={undefined}
           />;
           
  } catch (error) {
    fetchError = (error as Error).message || "Failed to load initial dashboard data.";
    return <DashboardPageClient 
             initialCandidates={[]} 
             initialPositions={[]} 
             initialUsers={[]} 
             initialFetchError={fetchError}
           />;
  }
}
