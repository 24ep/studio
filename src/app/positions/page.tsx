export const dynamic = "force-dynamic";
// src/app/positions/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import { fetchAllPositionsDb } from '@/lib/apiUtils';
import type { Position } from '@/lib/types';
import { authOptions } from '@/lib/auth';

export default async function PositionsPageServer() {
  let session: any = null;
  let initialPositions: Position[] = [];
  let initialAvailableDepartments: string[] = [];
  let fetchError: string | undefined = undefined;

  try {
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return <PositionsPageClient 
               initialPositions={[]} 
               initialAvailableDepartments={[]} 
               authError={true} 
             />;
    }

    // Check for general view permission if applicable
    // if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('POSITIONS_VIEW')) {
    //   return <PositionsPageClient initialPositions={[]} initialAvailableDepartments={[]} permissionError={true} />;
    // }

    initialPositions = await fetchAllPositionsDb();
    const uniqueDepts = Array.from(
      new Set(
        initialPositions
          .map(p => p.department)
          .filter((d): d is string => typeof d === 'string' && Boolean(d))
      )
    );
    initialAvailableDepartments = uniqueDepts.sort();
  } catch (error) {
    console.error("Server-side fetch error for positions:", error);
    fetchError = (error as Error).message || "Failed to load initial positions data.";
  }

  return (
    <PositionsPageClient
      initialPositions={initialPositions}
      initialAvailableDepartments={initialAvailableDepartments}
      initialFetchError={fetchError}
    />
  );
}
