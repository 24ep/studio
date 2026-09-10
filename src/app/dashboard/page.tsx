// src/app/dashboard/page.tsx - Server Component
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { auth } from '@/auth';
import DashboardPageClient, { DashboardMetrics } from '@/components/dashboard/DashboardPageClient';
import { getPool } from '@/lib/db';
import type { Applicant, Position, UserProfile } from '@/lib/types';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import SafeComponentWrapper from '@/components/ui/safe-component-wrapper';
import { hasPermission } from '@/lib/permissions';
import { fetchDashboardMetrics } from '@/lib/dashboard-metrics';
import {
  DASHBOARD_APPLICANTS_QUERY,
  DASHBOARD_POSITIONS_QUERY,
  DASHBOARD_STAGES_QUERY,
  DASHBOARD_USERS_QUERY,
  createDefaultDashboardMetrics,
  mapDashboardApplicants,
  mapDashboardPositions,
  mapDashboardStages,
  mapDashboardUsers,
  type DashboardApplicantRow,
  type DashboardPositionRow,
  type DashboardStageRow,
  type DashboardUserRow,
} from './dashboard-page-utils';
import './dashboard.css';

export default async function DashboardPageServer() {
  let initialApplicants: Applicant[] = [];
  let initialPositions: Position[] = [];
  let initialUsers: UserProfile[] = [];
  let initialMetrics: DashboardMetrics = createDefaultDashboardMetrics();
  let initialFetchError: string | undefined = undefined;
  let stageIds: Record<string, string | undefined> = {};
  let stageNames: Record<string, string> = {};

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return (
        <ErrorBoundary>
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <SafeComponentWrapper 
              fallbackTitle="Dashboard Page Error"
              fallbackDescription="There was an issue loading the dashboard page."
            >
              <DashboardPageClient 
                initialApplicants={[]} 
                initialPositions={[]} 
                initialUsers={[]} 
                initialMetrics={initialMetrics}
                authError={true}
                initialStageIds={{}}
                initialStageNames={{}}
              />
            </SafeComponentWrapper>
          </Suspense>
        </ErrorBoundary>
      );
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      const userId = session.user.id;
      const canViewAll = hasPermission(session.user, 'applicantS_VIEW');

      // Fetch optimized metrics
      initialMetrics = await fetchDashboardMetrics(client, userId, canViewAll);

      // Fetch other data sequentially to avoid overlapping client queries
      const applicantsResult = await client.query(DASHBOARD_APPLICANTS_QUERY, [canViewAll, userId]);
      const positionsResult = await client.query(DASHBOARD_POSITIONS_QUERY);
      const usersResult = await client.query(DASHBOARD_USERS_QUERY);
      const stagesResult = await client.query(DASHBOARD_STAGES_QUERY);

      // Transform Applicants data - omitting transitionHistory as it's expensive and now pre-calculated
      initialApplicants = mapDashboardApplicants(applicantsResult.rows as DashboardApplicantRow[]);
      initialPositions = mapDashboardPositions(positionsResult.rows as DashboardPositionRow[]);
      initialUsers = mapDashboardUsers(usersResult.rows as DashboardUserRow[]);
      ({ stageIds, stageNames } = mapDashboardStages(stagesResult.rows as DashboardStageRow[]));

    } finally {
      client.release();
    }
    
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <SafeComponentWrapper 
            fallbackTitle="Dashboard Page Error"
            fallbackDescription="There was an issue loading the dashboard page."
          >
            <DashboardPageClient 
              initialApplicants={initialApplicants} 
              initialPositions={initialPositions} 
              initialUsers={initialUsers} 
              initialMetrics={initialMetrics}
              initialFetchError={undefined}
              initialStageIds={stageIds}
              initialStageNames={stageNames}
            />
          </SafeComponentWrapper>
        </Suspense>
      </ErrorBoundary>
    );
           
  } catch (error) {
    initialFetchError = (error as Error).message || "Failed to load initial dashboard data.";
    return (
      <ErrorBoundary>
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <SafeComponentWrapper 
            fallbackTitle="Dashboard Page Error"
            fallbackDescription="There was an issue loading the dashboard page."
          >
            <DashboardPageClient 
              initialApplicants={[]} 
              initialPositions={[]} 
              initialUsers={[]} 
              initialMetrics={initialMetrics}
              initialFetchError={initialFetchError}
              initialStageIds={{}}
              initialStageNames={{}}
            />
          </SafeComponentWrapper>
        </Suspense>
      </ErrorBoundary>
    );
  }
}

