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
  
  // Check for general view permission if applicable for dashboard, or rely on role for now
  // Example: if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('DASHBOARD_VIEW')) { ... }
  // For this ATS, Admin/Manager typically see all, Recruiter sees their slice.

  let initialCandidates: Candidate[] = [];
  let initialPositions: Position[] = [];
  let initialUsers: UserProfile[] = [];
  let fetchError: string | undefined = undefined;

  try {
    if (session.user.role === 'Admin' || session.user.role === 'Hiring Manager') {
      initialCandidates = await fetchInitialDashboardCandidatesDb(50); // Fetch a reasonable number for admin dashboard
      initialUsers = await fetchAllUsersDb(); // Fetch all users for recruiter count
    } else if (session.user.role === 'Recruiter') {
      // For recruiter, dashboard candidates are their assigned ones
      // This might be simplified if the fetchInitialDashboardCandidatesDb can take a recruiterId
      const allMyCandidates = await fetchInitialDashboardCandidatesDb(200); // Fetch more, then filter
      initialCandidates = allMyCandidates.filter(c => c.recruiterId === session.user.id);
      // Recruiter might not need all users list
    }
    initialPositions = await fetchAllPositionsDb();
  } catch (error) {
    console.error("Server-side fetch error for dashboard:", error);
    fetchError = (error as Error).message || "Failed to load initial dashboard data.";
  }

  return (
    <DashboardPageClient
      initialCandidates={initialCandidates}
      initialPositions={initialPositions}
      initialUsers={initialUsers}
      initialFetchError={fetchError}
    />
  );
}
