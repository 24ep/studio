import { NextResponse } from 'next/server';
import { canEditApplicant, type SessionLikeUser } from '@/lib/permissions';
import { permissionMatches } from '@/lib/permission-aliases';
import type { AiEvaluationResult } from './evaluate-applicant-fit-schema';
import type { EvaluateFitApplicant, EvaluateFitClient } from './evaluate-applicant-fit-data';

type SaveEvaluationUser = SessionLikeUser & {
  id: string;
};

type FitParsedData = Record<string, unknown> & {
  job_applied?: Record<string, unknown>;
};

function toParsedData(value: unknown): FitParsedData {
  return value && typeof value === 'object' ? { ...(value as Record<string, unknown>) } : {};
}

function toJobApplied(value: unknown) {
  return value && typeof value === 'object' ? { ...(value as Record<string, unknown>) } : {};
}

export function validateSaveFitEvaluationAccess(user: SaveEvaluationUser, recruiterId: string | null) {
  const hasGlobalSensitiveEditPermission = permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE');
  const hasOwnSensitiveEditPermission = permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE_OWN');

  if (user.role !== 'Admin' && !hasGlobalSensitiveEditPermission && !hasOwnSensitiveEditPermission) {
    return NextResponse.json(
      { message: 'Forbidden: Insufficient permissions to save applicant score data' },
      { status: 403 }
    );
  }

  if (user.role !== 'Admin' && !hasGlobalSensitiveEditPermission) {
    const editPermission = canEditApplicant(user, recruiterId, user.id);
    if (!editPermission.canEdit) {
      return NextResponse.json({ message: `Forbidden: ${editPermission.reason}` }, { status: 403 });
    }
  }

  return null;
}

export async function saveFitEvaluation({
  client,
  applicant,
  applicantId,
  positionId,
  evaluation,
}: {
  client: EvaluateFitClient;
  applicant: EvaluateFitApplicant;
  applicantId: string;
  positionId: string;
  evaluation: AiEvaluationResult;
}) {
  await client.query('BEGIN');

  const parsedData = toParsedData(applicant.parsedData);
  parsedData.job_applied = {
    ...toJobApplied(parsedData.job_applied),
    fitScore: evaluation.fitScore,
    jobId: positionId,
    justification: evaluation.justification,
    aiEvaluation: {
      summary: evaluation.summary || '',
      strengths: evaluation.strengths || [],
      risks: evaluation.risks || [],
      evidence: evaluation.evidence || [],
      generatedAt: new Date().toISOString(),
    },
  };

  await client.query(`
    UPDATE "Applicant"
    SET "parsedData" = $1, "fitScore" = $2, "positionId" = $3, "assignmentJustification" = $4, "updatedAt" = NOW()
    WHERE id = $5
  `, [parsedData, evaluation.fitScore, positionId, evaluation.justification.join('\n'), applicantId]);
  await client.query('COMMIT');
}
