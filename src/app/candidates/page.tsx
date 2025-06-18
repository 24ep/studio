
// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { fetchAllPositionsDb, fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';

async function getInitialCandidatesData(session: any): Promise<{ candidates: Candidate[], error?: string, authError?: boolean, permissionError?: boolean }> {
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!userId) {
    return { candidates: [], authError: true, error: "User session required." };
  }
  
  // If user is not Admin and doesn't have CANDIDATES_VIEW permission, deny access.
  if (userRole !== 'Admin' && !session?.user?.modulePermissions?.includes('CANDIDATES_VIEW')) {
    return { candidates: [], permissionError: true, error: "You do not have permission to view candidates." };
  }

  let initialQuery = `
    SELECT
      c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c.custom_attributes,
      c."positionId", c."fitScore", c.status, c."applicationDate",
      c."recruiterId", c."createdAt", c."updatedAt",
      p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
      rec.name as "recruiterName",
      COALESCE(th_data.history, '[]'::json) as "transitionHistory"
    FROM "Candidate" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" rec ON c."recruiterId" = rec.id
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
  `;
  const queryParams = [];
  let paramIndex = 1;
  const conditions = [];

  // Recruiters by default see only their assigned candidates if they don't have general CANDIDATES_VIEW permission.
  // If they *do* have CANDIDATES_VIEW, they see all, similar to Admin.
  if (userRole === 'Recruiter' && !session?.user?.modulePermissions?.includes('CANDIDATES_VIEW')) {
    conditions.push(`c."recruiterId" = $${paramIndex++}`);
    queryParams.push(userId);
  }
  // Admins see all by default unless filtered on client.


  if (conditions.length > 0) {
    initialQuery += ' WHERE ' + conditions.join(' AND ');
  }
  initialQuery += ' ORDER BY c."createdAt" DESC LIMIT 50;'; // Initial limit

  try {
    const result = await pool.query(initialQuery, queryParams);
    const candidates = result.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      custom_attributes: row.custom_attributes || {},
      position: row.positionId ? {
          id: row.positionId,
          title: row.positionTitle,
          department: row.positionDepartment,
          position_level: row.positionLevel,
      } : null,
      recruiter: row.recruiterId ? {
          id: row.recruiterId,
          name: row.recruiterName,
          email: null
      } : null,
      transitionHistory: row.transitionHistory || [],
    }));
    return { candidates };
  } catch (error) {
    console.error("Server-side fetch error for initial candidates:", error);
    return { candidates: [], error: (error as Error).message || "Failed to load initial candidates." };
  }
}

export default async function CandidatesPageServer() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <CandidatesPageClient 
             initialCandidates={[]} 
             initialAvailablePositions={[]} 
             initialAvailableStages={[]} 
             authError={true} 
           />;
  }

  const { candidates: initialCandidates, error: candidatesError, authError: candidatesAuthError, permissionError: candidatesPermissionError } = await getInitialCandidatesData(session);
  
  let initialPositions: Position[] = [];
  let initialStages: RecruitmentStage[] = [];
  let auxDataError: string | null = null;

  try {
    initialPositions = await fetchAllPositionsDb();
  } catch(e) {
    console.error("Error fetching initial positions:", e);
    auxDataError = (auxDataError || "") + "Failed to load positions. ";
  }
  try {
    initialStages = await fetchAllRecruitmentStagesDb();
  } catch (e) {
    console.error("Error fetching initial stages:", e);
    auxDataError = (auxDataError || "") + "Failed to load recruitment stages. ";
  }
  
  const combinedError = [candidatesError, auxDataError].filter(Boolean).join(" ");

  if (candidatesAuthError || candidatesPermissionError) {
    return (
        <CandidatesPageClient
            initialCandidates={[]} 
            initialAvailablePositions={initialPositions}
            initialAvailableStages={initialStages}
            authError={candidatesAuthError}
            permissionError={candidatesPermissionError}
            initialFetchError={combinedError || undefined}
        />
    );
  }
  
  return (
    <CandidatesPageClient
      initialCandidates={initialCandidates}
      initialAvailablePositions={initialPositions}
      initialAvailableStages={initialStages}
      initialFetchError={combinedError || undefined}
    />
  );
}
