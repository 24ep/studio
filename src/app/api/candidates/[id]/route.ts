import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import type { CandidateStatus, Candidate, CandidateDetails, PersonalInfo, ContactInfo, PositionLevel, UserProfile, N8NJobMatch } from '@/lib/types';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  try {
    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData", c.custom_attributes,
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."recruiterId",
        c."createdAt", c."updatedAt",
        p.title as "positionTitle",
        p.department as "positionDepartment",
        p.position_level as "positionLevel",
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
      WHERE c.id = $1;
    `;
    const result = await pool.query(query, [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    const candidateRow = result.rows[0];
    let parsedDataFromDb: CandidateDetails | null = candidateRow.parsedData || { personal_info: {} as PersonalInfo, contact_info: {} as ContactInfo };

    if (parsedDataFromDb && Array.isArray(parsedDataFromDb.job_matches) && parsedDataFromDb.job_matches.length > 0) {
      const jobIdsToFetch = parsedDataFromDb.job_matches
        .map(match => match.job_id)
        .filter(id => id != null) as string[];

      if (jobIdsToFetch.length > 0) {
        const uniqueJobIds = [...new Set(jobIdsToFetch)];
        const positionTitlesRes = await pool.query('SELECT id, title FROM "Position" WHERE id = ANY($1::uuid[])', [uniqueJobIds]);
        const positionTitleMap = new Map(positionTitlesRes.rows.map(row => [row.id, row.title]));

        parsedDataFromDb.job_matches = parsedDataFromDb.job_matches.map(match => {
          if (match.job_id && positionTitleMap.has(match.job_id)) {
            return { ...match, job_title: positionTitleMap.get(match.job_id)! };
          }
          return match;
        });
      }
    }

    const candidate = {
        ...candidateRow,
        parsedData: parsedDataFromDb,
        custom_attributes: candidateRow.custom_attributes || {},
        position: candidateRow.positionId ? {
            id: candidateRow.positionId,
            title: candidateRow.positionTitle,
            department: candidateRow.positionDepartment,
            position_level: candidateRow.positionLevel,
        } : null,
        recruiter: candidateRow.recruiterId ? {
            id: candidateRow.recruiterId,
            name: candidateRow.recruiterName,
            email: null
        } : null,
        transitionHistory: candidateRow.transitionHistory || [],
    };
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates:GetById', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

// ...rest of the original code for PUT and DELETE handlers...
