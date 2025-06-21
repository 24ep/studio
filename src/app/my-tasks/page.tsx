// src/app/my-tasks/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import { pool } from '@/lib/db';
import { MyTasksPageClient } from '@/components/tasks/MyTasksPageClient';
import type { Candidate, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { fetchAllPositionsDb, fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';

async function getInitialTaskBoardData(session: any): Promise<{
  initialCandidates: Candidate[];
  initialPositions: Position[];
  initialStages: RecruitmentStage[];
  initialRecruiters: Pick<UserProfile, 'id' | 'name'>[];
  error?: string;
  authError?: boolean;
  permissionError?: boolean;
}> {
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!userId) {
    return { initialCandidates: [], initialPositions: [], initialStages: [], initialRecruiters: [], authError: true, error: "User session required." };
  }
  if (userRole !== 'Recruiter' && userRole !== 'Admin') {
    return { initialCandidates: [], initialPositions: [], initialStages: [], initialRecruiters: [], permissionError: true, error: "You do not have permission to view this page." };
  }

  let accumulatedError = "";

  // Set up all promises
  const positionsPromise = fetchAllPositionsDb();
  const stagesPromise = fetchAllRecruitmentStagesDb();

  let recruitersPromise;
  if (userRole === 'Admin') {
    recruitersPromise = pool.query('SELECT id, name FROM "User" WHERE role = $1 OR role = $2 ORDER BY name ASC', ['Recruiter', 'Admin']);
  } else {
    recruitersPromise = Promise.resolve({ rows: [{id: userId, name: session.user.name || 'My Tasks'}] });
  }

  const defaultRecruiterIdFilter = userId;
  const candidateQuery = `
    SELECT
      c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c.custom_attributes,
      c."positionId", c."fitScore", c.status, c."applicationDate",
      c."recruiterId", c."createdAt", c."updatedAt",
      p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
      rec_user.name as "recruiterName",
      COALESCE(th_data.history, '[]'::json) as "transitionHistory"
    FROM "Candidate" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" rec_user ON c."recruiterId" = rec_user.id
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 'notes', th.notes, 'actingUserId', th."actingUserId", 'actingUserName', u_th.name, 'createdAt', th."createdAt", 'updatedAt', th."updatedAt")) AS history FROM "TransitionRecord" th LEFT JOIN "User" u_th ON th."actingUserId" = u_th.id WHERE th."candidateId" = c.id
    ) AS th_data ON true
    WHERE c."recruiterId" = $1
    ORDER BY c."createdAt" DESC LIMIT 50;
  `;
  const candidatesPromise = pool.query(candidateQuery, [defaultRecruiterIdFilter]);

  // Await all promises
  const [
    positionsResult,
    stagesResult,
    recruitersQueryResult,
    candidatesQueryResult
  ] = await Promise.allSettled([
    positionsPromise,
    stagesPromise,
    recruitersPromise,
    candidatesPromise
  ]);

  let initialPositions: Position[] = [];
  if (positionsResult.status === 'fulfilled') {
    initialPositions = positionsResult.value;
  } else {
    accumulatedError += "Failed to load positions. ";
    console.error("MyTasksPageServer fetchAllPositionsDb Error:", positionsResult.reason);
  }

  let initialStages: RecruitmentStage[] = [];
  if (stagesResult.status === 'fulfilled') {
    initialStages = stagesResult.value;
  } else {
    accumulatedError += "Failed to load stages. ";
    console.error("MyTasksPageServer fetchAllRecruitmentStagesDb Error:", stagesResult.reason);
  }

  let initialRecruiters: Pick<UserProfile, 'id' | 'name'>[] = [];
  if (recruitersQueryResult.status === 'fulfilled') {
    initialRecruiters = recruitersQueryResult.value.rows;
  } else {
    accumulatedError += "Failed to load recruiters. ";
    console.error("MyTasksPageServer fetch recruiters Error:", recruitersQueryResult.reason);
  }

  let initialCandidates: Candidate[] = [];
  if (candidatesQueryResult.status === 'fulfilled') {
    initialCandidates = candidatesQueryResult.value.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      custom_attributes: row.custom_attributes || {},
      position: row.positionId ? { id: row.positionId, title: row.positionTitle, department: row.department, position_level: row.positionLevel } : null,
      recruiter: row.recruiterId ? { id: row.recruiterId, name: row.recruiterName, email: null } : null,
      transitionHistory: row.transitionHistory || [],
    }));
  } else {
    accumulatedError += `Failed to load initial candidates: ${(candidatesQueryResult.reason as Error).message}. `;
    console.error("MyTasksPageServer fetch initial candidates Error:", candidatesQueryResult.reason);
  }

  return { initialCandidates, initialPositions, initialStages, initialRecruiters, error: accumulatedError.trim() || undefined };
}

export default async function MyTasksPageServer() {
  const session = await getServerSession();

  if (!session?.user) {
    return <MyTasksPageClient
             initialCandidates={[]}
             initialPositions={[]}
             initialStages={[]}
             initialRecruiters={[]}
             authError={true}
           />;
  }

  const { initialCandidates, initialPositions, initialStages, initialRecruiters, error, authError, permissionError } = await getInitialTaskBoardData(session);

  if (authError || permissionError) {
     return <MyTasksPageClient
             initialCandidates={[]}
             initialPositions={initialPositions}
             initialStages={initialStages}
             initialRecruiters={initialRecruiters}
             authError={authError}
             permissionError={permissionError}
             initialFetchError={error}
           />;
  }

  return (
    <MyTasksPageClient
      initialCandidates={initialCandidates}
      initialPositions={initialPositions}
      initialStages={initialStages}
      initialRecruiters={initialRecruiters}
      initialFetchError={error}
    />
  );
}
