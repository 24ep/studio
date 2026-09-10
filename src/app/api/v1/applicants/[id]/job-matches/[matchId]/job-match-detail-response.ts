import { type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { jsonCors } from '../job-matches-response';
import { jobMatchDetailSchema } from './job-match-detail-schema';

export type JobMatchResponseBase = {
  id: string;
  fitScore: number | null;
  jobId: string | null;
  matchReasons?: string[] | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type FetchedJobMatch = JobMatchResponseBase & {
  positionTitle: string | null;
};

export async function parseJobMatchDetailBody(request: NextRequest) {
  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return {
        ok: false as const,
        response: jsonCors(request, { error: 'Invalid JSON body' }, 400),
      };
    }

    const validationResult = jobMatchDetailSchema.safeParse(bodyResult.value);

    if (!validationResult.success) {
      return {
        ok: false as const,
        response: jsonCors(
          request,
          { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
          400,
        ),
      };
    }

    return {
      ok: true as const,
      input: validationResult.data,
    };
  } catch {
    return {
      ok: false as const,
      response: jsonCors(request, { error: 'Invalid JSON body' }, 400),
    };
  }
}

export function serializeFetchedJobMatch(match: FetchedJobMatch) {
  return {
    id: match.id,
    fitScore: match.fitScore,
    jobId: match.jobId,
    matchReasons: match.matchReasons || [],
    positionTitle: match.positionTitle,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

export function serializeUpdatedJobMatch(match: JobMatchResponseBase) {
  return {
    id: match.id,
    fitScore: match.fitScore,
    jobId: match.jobId,
    matchReasons: match.matchReasons || [],
    updatedAt: match.updatedAt,
  };
}

export function serializeDeletedJobMatch(match: Pick<JobMatchResponseBase, 'id'>, applicantId: string) {
  return {
    id: match.id,
    applicantId,
  };
}
