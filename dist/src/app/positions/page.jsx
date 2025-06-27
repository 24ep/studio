export const dynamic = "force-dynamic";
// src/app/positions/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import PositionsPageClient from '@/components/positions/PositionsPageClient';
import { fetchAllPositionsDb } from '@/lib/apiUtils';
import { authOptions } from '@/lib/auth';
export default async function PositionsPageServer() {
    let session = null;
    let initialPositions = [];
    let initialAvailableDepartments = [];
    let fetchError = undefined;
    try {
        console.log("[BUILD LOG] Before getServerSession");
        session = await getServerSession(authOptions);
        console.log("[BUILD LOG] After getServerSession");
        if (!session?.user) {
            return <PositionsPageClient initialPositions={[]} initialAvailableDepartments={[]} authError={true}/>;
        }
        // Check for general view permission if applicable
        // if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('POSITIONS_VIEW')) {
        //   return <PositionsPageClient initialPositions={[]} initialAvailableDepartments={[]} permissionError={true} />;
        // }
        console.log("[BUILD LOG] Before fetchAllPositionsDb");
        initialPositions = await fetchAllPositionsDb();
        console.log("[BUILD LOG] After fetchAllPositionsDb");
        const uniqueDepts = Array.from(new Set(initialPositions
            .map(p => p.department)
            .filter((d) => typeof d === 'string' && Boolean(d))));
        initialAvailableDepartments = uniqueDepts.sort();
    }
    catch (error) {
        console.error("Server-side fetch error for positions:", error);
        fetchError = error.message || "Failed to load initial positions data.";
    }
    return (<PositionsPageClient initialPositions={initialPositions} initialAvailableDepartments={initialAvailableDepartments} initialFetchError={fetchError}/>);
}
