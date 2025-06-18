
// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage } from '@/lib/types';
import { fetchAllPositionsDb, fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';

async function getInitialCandidatesData(session: any): Promise<{ candidates: Candidate[], error?: string, authError?: boolean, permissionError?: boolean }> {
  const userRole = session?.user?.role;
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

  // Recruiters by default see only their assigned candidates.
  // Admins see all unless a specific filter is applied on client (or if we add server-side default admin filter here).
  if (userRole === 'Recruiter') {
    if (!session?.user?.id) {
      return { candidates: [], authError: true, error: "User session required for Recruiter view." };
    }
    conditions.push(`c."recruiterId" = $${paramIndex++}`);
    queryParams.push(session.user.id);
  }


  if (conditions.length > 0) {
    initialQuery += ' WHERE ' + conditions.join(' AND ');
  }
  initialQuery += ' ORDER BY c."createdAt" DESC LIMIT 50;';

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
    // This case should ideally be caught by middleware or AuthProvider,
    // but as a fallback, pass authError to client.
    return <CandidatesPageClient 
             initialCandidates={[]} 
             initialAvailablePositions={[]} 
             initialAvailableStages={[]} 
             authError={true} 
           />;
  }

  const { candidates: initialCandidates, error: candidatesError, authError: candidatesAuthError, permissionError: candidatesPermissionError } = await getInitialCandidatesData(session);
  
  // Fetch these regardless of candidate fetch outcome, as they are needed for filters/modals
  const initialPositions = await fetchAllPositionsDb();
  const initialStages = await fetchAllRecruitmentStagesDb();

  if (candidatesAuthError || candidatesPermissionError) {
    return (
        <CandidatesPageClient
            initialCandidates={[]} // Send empty if there was an auth/permission error
            initialAvailablePositions={initialPositions}
            initialAvailableStages={initialStages}
            authError={candidatesAuthError}
            permissionError={candidatesPermissionError}
        />
    );
  }
  
  // If there's a general error fetching candidates but no auth/permission issue, pass it along
  if (candidatesError) {
    console.error("Server-side candidates fetch error passed to client:", candidatesError);
  }


  return (
    <CandidatesPageClient
      initialCandidates={initialCandidates}
      initialAvailablePositions={initialPositions}
      initialAvailableStages={initialStages}
    />
  );
}
