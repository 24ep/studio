// src/app/my-tasks/page.tsx (Server Component)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
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

  let initialPositions: Position[] = [];
  let initialStages: RecruitmentStage[] = [];
  let initialRecruiters: Pick<UserProfile, 'id' | 'name'>[] = [];
  let initialCandidates: Candidate[] = [];
  let accumulatedError = "";

  if (!userId) {
    return { initialCandidates, initialPositions, initialStages, initialRecruiters, authError: true, error: "User session required." };
  }

  if (userRole !== 'Recruiter' && userRole !== 'Admin') {
    return { initialCandidates, initialPositions, initialStages, initialRecruiters, permissionError: true, error: "You do not have permission to view this page." };
  }

  try {
    initialPositions = await fetchAllPositionsDb();
  } catch (e) { accumulatedError += "Failed to load positions. "; console.error("MyTasksPageServer fetchAllPositionsDb Error:", e); }

  try {
    initialStages = await fetchAllRecruitmentStagesDb();
  } catch (e) { accumulatedError += "Failed to load stages. "; console.error("MyTasksPageServer fetchAllRecruitmentStagesDb Error:", e); }

  try {
    if (userRole === 'Admin') {
      const recResult = await pool.query('SELECT id, name FROM "User" WHERE role = $1 ORDER BY name ASC', ['Recruiter']);
      initialRecruiters = recResult.rows;
    } else {
      // For a Recruiter, they might only need their own details initially for "My Assigned"
      initialRecruiters = [{id: userId, name: session.user.name || 'My Tasks'}];
    }
  } catch (e) { accumulatedError += "Failed to load recruiters. "; console.error("MyTasksPageServer fetch recruiters Error:", e); }

  try {
    // Default filter for task board: assigned to the logged-in user if Recruiter,
    // or their own tasks if Admin initially selects "My Assigned" (client-side will handle full admin view)
    let defaultRecruiterIdFilter = userId;
    
    // For admin, initially load their own tasks. The client can then change filter to view all or others.
    // If it's a recruiter, always load their tasks.
    // This initial query is for the default view of the page.

    let candidateQuery = `
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
        SELECT json_agg(
          json_build_object(
            'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage,
            'notes', th.notes, 'actingUserId', th."actingUserId", 'actingUserName', u_th.name,
            'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
          ) ORDER BY th.date DESC
        ) AS history
        FROM "TransitionRecord" th
        LEFT JOIN "User" u_th ON th."actingUserId" = u_th.id
        WHERE th."candidateId" = c.id
      ) AS th_data ON true
      WHERE c."recruiterId" = $1
      ORDER BY c."createdAt" DESC LIMIT 50;
    `;
    const queryParams = [defaultRecruiterIdFilter];

    const result = await pool.query(candidateQuery, queryParams);
    initialCandidates = result.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      custom_attributes: row.custom_attributes || {},
      position: row.positionId ? { id: row.positionId, title: row.positionTitle, department: row.positionDepartment, position_level: row.positionLevel } : null,
      recruiter: row.recruiterId ? { id: row.recruiterId, name: row.recruiterName, email: null } : null,
      transitionHistory: row.transitionHistory || [],
    }));

  } catch (e) { accumulatedError += `Failed to load initial candidates: ${(e as Error).message}. `; console.error("MyTasksPageServer fetch initial candidates Error:", e); }

  return { initialCandidates, initialPositions, initialStages, initialRecruiters, error: accumulatedError.trim() || undefined };
}


export default async function MyTasksPageServer() {
  const session = await getServerSession(authOptions);

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
