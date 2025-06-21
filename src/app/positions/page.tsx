// src/app/positions/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import { fetchAllPositionsDb } from '@/lib/apiUtils';
import type { Position } from '@/lib/types';

export default async function PositionsPageServer() {
  const session = await getServerSession();

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


  let initialPositions: Position[] = [];
  let initialAvailableDepartments: string[] = [];
  let fetchError: string | undefined = undefined;

  try {
    initialPositions = await fetchAllPositionsDb();
    const uniqueDepts = Array.from(new Set(initialPositions.map(p => p.department).filter(Boolean as (value: any) => value is string)));
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
