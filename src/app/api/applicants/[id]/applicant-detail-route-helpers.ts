import { z } from 'zod';

interface ApplicantDetailFetchErrorResponse {
  body: Record<string, unknown>;
  status: number;
}

interface ApplicantUpdateErrorResponse {
  body: Record<string, unknown>;
  status: number;
}

const applicantIdSchema = z.string().uuid();

export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export function isValidApplicantId(id: string) {
  return applicantIdSchema.safeParse(id).success;
}

export function parseApplicantLiteParam(url: URL) {
  const lite = url.searchParams.get('lite');
  return lite === '1' || lite === 'true';
}

export function buildApplicantDetailSuccessHeaders(responseData: unknown) {
  return {
    ...NO_CACHE_HEADERS,
    'ETag': `"${Buffer.from(JSON.stringify(responseData)).toString('base64').slice(0, 8)}"`,
  };
}

export function mapApplicantDetailFetchError(
  error: { code?: string; message?: string } | null | undefined,
  applicantId: string
): ApplicantDetailFetchErrorResponse {
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return {
      status: 503,
      body: {
        message: 'Database connection error. Please try again in a moment.',
        error: 'Database connection failed',
        applicantId,
      },
    };
  }

  if (error?.code === '57014' || error?.message?.includes('timeout')) {
    return {
      status: 408,
      body: {
        message: 'Request timed out. The server may be experiencing high load. Please try again in a moment.',
        error: 'Database timeout',
        applicantId,
      },
    };
  }

  return {
    status: 500,
    body: {
      message: 'Error fetching Applicant',
      error: error?.message || String(error),
      applicantId,
    },
  };
}

export function mapApplicantUpdateError(
  error: { code?: string; constraint?: string; message?: string } | null | undefined
): ApplicantUpdateErrorResponse {
  if (error?.code === '23503') {
    if (error.constraint === 'TransitionRecord_positionId_fkey') {
      return {
        status: 400,
        body: { message: 'Invalid position reference in transition record' },
      };
    }

    if (error.constraint === 'TransitionRecord_applicantId_fkey') {
      return {
        status: 400,
        body: { message: 'Invalid Applicant reference in transition record' },
      };
    }

    return {
      status: 400,
      body: {
        message: 'Foreign key constraint violation',
        error: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      message: 'Error updating Applicant',
      error: error?.message || String(error),
    },
  };
}

export function isApplicantQueryTimeoutError(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === '57014' || Boolean(error?.message?.includes('timeout'));
}
