// src/app/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';
import { fetchInitialDashboardCandidatesDb, fetchAllPositionsDb, fetchAllUsersDb } from '@/lib/apiUtils';
export default async function DashboardPageServer() {
    let session = null;
    let initialCandidates = [];
    let initialPositions = [];
    let initialUsers = [];
    let fetchError = undefined;
    let usersFetchFailed = false;
    try {
        session = await getServerSession(authOptions);
        if (!session?.user) {
            return <DashboardPageClient initialCandidates={[]} initialPositions={[]} initialUsers={[]} authError={true}/>;
        }
        const positionsPromise = fetchAllPositionsDb();
        let candidatesPromise;
        let usersPromise = Promise.resolve(null);
        if (session.user.role === 'Admin' || session.user.role === 'Hiring Manager') {
            candidatesPromise = fetchInitialDashboardCandidatesDb(50);
            usersPromise = fetchAllUsersDb();
        }
        else if (session.user.role === 'Recruiter') {
            candidatesPromise = fetchInitialDashboardCandidatesDb(200); // Fetch more to filter client-side for now
        }
        else {
            candidatesPromise = Promise.resolve([]);
        }
        const [positionsResult, candidatesResult, usersResult] = await Promise.allSettled([
            positionsPromise,
            candidatesPromise,
            usersPromise
        ]);
        if (positionsResult.status === 'fulfilled') {
            initialPositions = positionsResult.value;
        }
        else {
            fetchError = (fetchError || "") + "Failed to load positions. ";
        }
        if (candidatesResult.status === 'fulfilled') {
            if (session.user.role === 'Recruiter') {
                initialCandidates = candidatesResult.value.filter(c => c.recruiterId === session.user.id);
            }
            else {
                initialCandidates = candidatesResult.value;
            }
        }
        else {
            fetchError = (fetchError || "") + "Failed to load candidates. ";
        }
        if (usersResult.status === 'fulfilled' && usersResult.value) {
            initialUsers = usersResult.value;
        }
        else if (usersResult.status === 'rejected') {
            usersFetchFailed = true;
            initialUsers = [];
        }
    }
    catch (error) {
        fetchError = error.message || "Failed to load initial dashboard data.";
    }
    return (<DashboardPageClient initialCandidates={Array.isArray(initialCandidates) ? initialCandidates : []} initialPositions={Array.isArray(initialPositions) ? initialPositions : []} initialUsers={Array.isArray(initialUsers) ? initialUsers : []} initialFetchError={fetchError?.trim()}/>);
}
