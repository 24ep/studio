// src/app/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';
import { fetchInitialDashboardCandidatesDb, fetchAllPositionsDb, fetchAllUsersDb } from '@/lib/apiUtils';
import type { Candidate, Position, UserProfile } from '@/lib/types';

export default async function DashboardPageServer() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <DashboardPageClient 
             initialCandidates={[]} 
             initialPositions={[]} 
             initialUsers={[]} 
             authError={true} 
           />;
  }
  
  let initialCandidates: Candidate[] = [];
  let initialPositions: Position[] = [];
  let initialUsers: UserProfile[] = [];
  let fetchError: string | undefined = undefined;

  try {
    const positionsPromise = fetchAllPositionsDb();
    let candidatesPromise: Promise<Candidate[]>;
    let usersPromise: Promise<UserProfile[]> | Promise<null> = Promise.resolve(null);

    if (session.user.role === 'Admin' || session.user.role === 'Hiring Manager') {
      candidatesPromise = fetchInitialDashboardCandidatesDb(50);
      usersPromise = fetchAllUsersDb();
    } else if (session.user.role === 'Recruiter') {
      // For recruiter, dashboard candidates are their assigned ones
      candidatesPromise = fetchInitialDashboardCandidatesDb(200); // Fetch more to filter client-side for now
    } else {
      candidatesPromise = Promise.resolve([]);
    }

    const [positionsResult, candidatesResult, usersResult] = await Promise.allSettled([
      positionsPromise,
      candidatesPromise,
      usersPromise
    ]);

    if (positionsResult.status === 'fulfilled') {
      initialPositions = positionsResult.value;
    } else {
      console.error("Dashboard server fetch error (positions):", positionsResult.reason);
      fetchError = (fetchError || "") + "Failed to load positions. ";
    }
    
    if (candidatesResult.status === 'fulfilled') {
      if (session.user.role === 'Recruiter') {
         initialCandidates = candidatesResult.value.filter(c => c.recruiterId === session.user.id);
      } else {
         initialCandidates = candidatesResult.value;
      }
    } else {
      console.error("Dashboard server fetch error (candidates):", candidatesResult.reason);
      fetchError = (fetchError || "") + "Failed to load candidates. ";
    }

    if (usersResult.status === 'fulfilled' && usersResult.value) {
      initialUsers = usersResult.value;
    } else if (usersResult.status === 'rejected') {
      console.error("Dashboard server fetch error (users):", usersResult.reason);
      fetchError = (fetchError || "") + "Failed to load users. ";
    }
    
  } catch (error) {
    console.error("Server-side fetch error for dashboard:", error);
    fetchError = (error as Error).message || "Failed to load initial dashboard data.";
  }

  return (
    <DashboardPageClient
      initialCandidates={initialCandidates}
      initialPositions={initialPositions}
      initialUsers={initialUsers}
      initialFetchError={fetchError?.trim()}
    />
  );
}
