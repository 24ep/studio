export const dynamic = "force-dynamic";
// src/app/candidates/page.tsx - Server Component
import { getServerSession } from 'next-auth/next';
import { getPool } from '@/lib/db';
import { CandidatesPageClient } from '@/components/candidates/CandidatesPageClient';
import type { Candidate, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { fetchAllPositionsDb, fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';
import { authOptions } from '@/lib/auth';
import { CandidateQueueProvider } from "@/components/candidates/CandidateImportUploadQueue";

async function getInitialCandidatesData(session: any): Promise<{ candidates: Candidate[], error?: string, authError?: boolean, permissionError?: boolean }> {
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!userId) {
    return { candidates: [], authError: true, error: "User session required." };
  }
  
  if (userRole !== 'Admin' && !session?.user?.modulePermissions?.includes('CANDIDATES_VIEW')) {
    return { candidates: [], permissionError: true, error: "You do not have permission to view candidates." };
  }

  let initialQuery = `
    SELECT
      c.id, c.name, c.email, c.phone, c."avatarUrl", c."dataAiHint", c."resumePath", c."parsedData", c."customAttributes",
      c."positionId", c."fitScore", c.status, c."applicationDate",
      c."recruiterId", c."createdAt", c."updatedAt",
      p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
      rec.name as "recruiterName",
      COALESCE(th_data.history, '[]'::json) as "transitionHistory"
    FROM "candidates" c
    LEFT JOIN "positions" p ON c."positionId" = p.id
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

  if (userRole === 'Recruiter' && !session?.user?.modulePermissions?.includes('CANDIDATES_VIEW')) {
    conditions.push(`c."recruiterId" = $${paramIndex++}`);
    queryParams.push(userId);
  }

  if (conditions.length > 0) {
    initialQuery += ' WHERE ' + conditions.join(' AND ');
  }
  initialQuery += ' ORDER BY c."createdAt" DESC LIMIT 50;';

  try {
    const result = await getPool().query(initialQuery, queryParams);
    const candidates = result.rows.map(row => ({
      ...row,
      parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
      customAttributes: row.customAttributes || {},
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
  console.log("[BUILD LOG] Before getServerSession");
  const session = await getServerSession(authOptions);
  console.log("[BUILD LOG] After getServerSession");

  if (!session?.user) {
    return <CandidatesPageClient 
             initialCandidates={[]} 
             initialAvailablePositions={[]} 
             initialAvailableStages={[]} 
             authError={true} 
           />;
  }

  console.log("[BUILD LOG] Before getInitialCandidatesData, fetchAllPositionsDb, fetchAllRecruitmentStagesDb");
  const candidatesPromise = getInitialCandidatesData(session);
  const positionsPromise = fetchAllPositionsDb();
  const stagesPromise = fetchAllRecruitmentStagesDb();
  console.log("[BUILD LOG] After getInitialCandidatesData, fetchAllPositionsDb, fetchAllRecruitmentStagesDb");
  
  console.log("[BUILD LOG] Before Promise.allSettled for candidates page");
  const [
    candidatesResult,
    positionsResult,
    stagesResult,
  ] = await Promise.allSettled([
    candidatesPromise,
    positionsPromise,
    stagesPromise,
  ]);
  console.log("[BUILD LOG] After Promise.allSettled for candidates page");

  let initialCandidates: Candidate[] = [];
  let candidatesError: string | undefined = undefined;
  let candidatesAuthError: boolean = false;
  let candidatesPermissionError: boolean = false;
  
  if (candidatesResult.status === 'fulfilled') {
      initialCandidates = candidatesResult.value.candidates;
      candidatesError = candidatesResult.value.error;
      candidatesAuthError = candidatesResult.value.authError || false;
      candidatesPermissionError = candidatesResult.value.permissionError || false;
  } else {
      console.error("Error fetching initial candidates data:", candidatesResult.reason);
      candidatesError = "Failed to load candidates data.";
  }

  let initialPositions: Position[] = [];
  let auxDataError: string | null = null;
  if (positionsResult.status === 'fulfilled') {
    initialPositions = positionsResult.value;
  } else {
    console.error("Error fetching initial positions:", positionsResult.reason);
    auxDataError = (auxDataError || "") + "Failed to load positions. ";
  }

  let initialStages: RecruitmentStage[] = [];
  if (stagesResult.status === 'fulfilled') {
    initialStages = stagesResult.value;
  } else {
    console.error("Error fetching initial stages:", stagesResult.reason);
    auxDataError = (auxDataError || "") + "Failed to load recruitment stages. ";
  }
  
  const combinedError = [candidatesError, auxDataError].filter(Boolean).join(" ");

  if (candidatesAuthError || candidatesPermissionError) {
    return (
      <CandidateQueueProvider>
        <CandidatesPageClient
          initialCandidates={[]}
          initialAvailablePositions={initialPositions}
          initialAvailableStages={initialStages}
          authError={candidatesAuthError}
          permissionError={candidatesPermissionError}
          initialFetchError={combinedError || undefined}
        />
      </CandidateQueueProvider>
    );
  }
  
  return (
    <CandidateQueueProvider>
      <CandidatesPageClient
        initialCandidates={initialCandidates}
        initialAvailablePositions={initialPositions}
        initialAvailableStages={initialStages}
        initialFetchError={combinedError || undefined}
      />
    </CandidateQueueProvider>
  );
}
