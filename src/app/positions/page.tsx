// src/app/positions/page.tsx (Server Component)
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import type { Position } from '@/lib/types';

export default async function PositionsPageServer() {
  // Remove build-time database calls and session fetching
  // Let the client handle data fetching
  
  return (
    <PositionsPageClient
      initialPositions={[]}
      initialAvailableDepartments={[]}
      initialFetchError={undefined}
    />
  );
}
