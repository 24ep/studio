// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage } from '@/lib/types';
import { fetchAllPositionsDb, fetchAllRecruitmentStagesDb } from '@/lib/apiUtils'; // Utility functions

async function getInitialCandidatesData(session: any): Promise<{ candidates: Candidate[], error?: string, authError?: boolean, permissionError?: boolean }> {
  const userRole = session?.user?.role;
  let initialQuery = `
    SELECT
      c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData", c.custom_attributes,
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

  // Default filtering for initial load based on role
  if (userRole === 'Recruiter') {
    if (!session?.user?.id) {
      return { candidates: [], authError: true, error: "User session required for Recruiter view." };
    }
    conditions.push(`c."recruiterId" = $${paramIndex++}`);
    queryParams.push(session.user.id);
  }
  // Admin sees all by default. Hiring Manager sees all by default (can be changed if needed).

  if (conditions.length > 0) {
    initialQuery += ' WHERE ' + conditions.join(' AND ');
  }
  initialQuery += ' ORDER BY c."createdAt" DESC LIMIT 50;'; // Add a reasonable limit for initial load

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
    // Pass authError to client to handle redirect/message
    return <CandidatesPageClient initialCandidates={[]} initialAvailablePositions={[]} initialAvailableStages={[]} authError={true} />;
  }
  
  // Example permission check (can be more granular)
  // if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_VIEW')) {
  //   return <CandidatesPageClient initialCandidates={[]} initialAvailablePositions={[]} initialAvailableStages={[]} permissionError={true} />;
  // }

  const { candidates: initialCandidates, error: candidatesError, authError: candidatesAuthError, permissionError: candidatesPermissionError } = await getInitialCandidatesData(session);
  const initialPositions = await fetchAllPositionsDb();
  const initialStages = await fetchAllRecruitmentStagesDb();

  if (candidatesAuthError || candidatesPermissionError || candidatesError) {
    // Pass error states to client component to render appropriate UI
    return (
        <CandidatesPageClient 
            initialCandidates={[]} 
            initialAvailablePositions={initialPositions} 
            initialAvailableStages={initialStages} 
            authError={candidatesAuthError}
            permissionError={candidatesPermissionError}
            // You might want to pass the candidatesError message too if client handles its display
        />
    );
  }

  return (
    <CandidatesPageClient
      initialCandidates={initialCandidates}
      initialAvailablePositions={initialPositions}
      initialAvailableStages={initialStages}
    />
  );
}
