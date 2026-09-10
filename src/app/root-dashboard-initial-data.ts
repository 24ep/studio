import { getPool } from '@/lib/db';
import type { PoolClient } from 'pg';
import { getRootDashboardErrorDiagnostics } from './root-dashboard-initial-errors';
import {
  mapDashboardApplicantRows,
  mapDashboardPositionRows,
  mapDashboardStageRows,
  mapDashboardUserRows,
} from './root-dashboard-initial-mappers';
import type {
  DashboardApplicantRow,
  DashboardPositionRow,
  DashboardStageRow,
  DashboardUserRow,
  RootDashboardInitialData,
} from './root-dashboard-initial-types';

const EMPTY_ROOT_DASHBOARD_INITIAL_DATA: RootDashboardInitialData = {
  initialApplicants: [],
  initialPositions: [],
  initialUsers: [],
  initialStageIds: {},
  initialStageNames: {},
};

export async function getRootDashboardInitialData(): Promise<RootDashboardInitialData> {
  let client: PoolClient | null = null;

  try {
    client = await getPool().connect();

    const [applicantRows, positionRows, userRows, stageRows] = await Promise.all([
      queryDashboardApplicants(client),
      queryDashboardPositions(client),
      queryDashboardUsers(client),
      queryDashboardStages(client),
    ]);
    const { stageIds, stageNames } = mapDashboardStageRows(stageRows);

    return {
      initialApplicants: mapDashboardApplicantRows(applicantRows),
      initialPositions: mapDashboardPositionRows(positionRows),
      initialUsers: mapDashboardUserRows(userRows),
      initialStageIds: stageIds,
      initialStageNames: stageNames,
    };
  } catch (error) {
    const diagnostics = getRootDashboardErrorDiagnostics(error);
    console.error('Error fetching initial data:', error);
    console.error('Error details:', diagnostics);

    return {
      ...EMPTY_ROOT_DASHBOARD_INITIAL_DATA,
      initialFetchError: `Failed to load initial data: ${diagnostics.message}`,
    };
  } finally {
    if (client) {
      releaseRootDashboardClient(client);
    }
  }
}

async function queryDashboardApplicants(client: PoolClient): Promise<DashboardApplicantRow[]> {
  const result = await client.query<DashboardApplicantRow>(`
    SELECT c.*, p.id as "positionId", p.title as "positionTitle", p.department as "positionDepartment", p."positionLevel" as "positionLevel", p."isOpen" as "positionIsOpen",
           r.id as "recruiterId", r.name as "recruiterName", r.email as "recruiterEmail", r."avatarUrl" as "recruiterAvatarUrl",
           rs.id as "statusId", rs.name as "status",
           COALESCE(th_data.history, '[]'::json) as "transitionHistory"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" r ON c."recruiterId" = r.id
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'id', th.id, 'date', th.date, 'stage', th.stage, 'notes', th.notes
        ) ORDER BY th.date DESC
      ) AS history
      FROM "TransitionRecord" th
      WHERE th."applicant_id" = c.id
    ) AS th_data ON true
    ORDER BY c."applicationDate" DESC;
  `);

  return result.rows;
}

async function queryDashboardPositions(client: PoolClient): Promise<DashboardPositionRow[]> {
  const result = await client.query<DashboardPositionRow>('SELECT * FROM "Position" ORDER BY "createdAt" DESC;');
  return result.rows;
}

async function queryDashboardUsers(client: PoolClient): Promise<DashboardUserRow[]> {
  const result = await client.query<DashboardUserRow>('SELECT * FROM "User" ORDER BY "createdAt" DESC;');
  return result.rows;
}

async function queryDashboardStages(client: PoolClient): Promise<DashboardStageRow[]> {
  const result = await client.query<DashboardStageRow>(
    'SELECT id, name FROM "RecruitmentStage" ORDER BY "sort_order" ASC;'
  );
  return result.rows;
}

function releaseRootDashboardClient(client: PoolClient) {
  try {
    client.release();
  } catch (releaseError) {
    console.error('Error releasing database client:', releaseError);
  }
}
