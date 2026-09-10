import type { QueryableClient } from './bulk-action-route-client-types';

type HeadcountRow = {
  id: string;
  status: string | null;
  applicantId: string | null;
};

type HeadcountCountRow = {
  total: string;
  filled: string;
};

function buildHeadcountStatus(headcounts: HeadcountRow[]) {
  const vacantHeadcounts = headcounts.filter((headcount) => {
    return headcount.status === 'vacant' || headcount.applicantId === null;
  });
  const filledHeadcounts = headcounts.filter((headcount) => {
    return headcount.status === 'filled' && headcount.applicantId !== null;
  });

  return {
    vacantHeadcounts,
    filledHeadcounts,
    summary: {
      hasHeadcounts: true,
      totalHeadcounts: headcounts.length,
      vacantHeadcounts: vacantHeadcounts.length,
      filledHeadcounts: filledHeadcounts.length,
    },
  };
}

export function buildHeadcountValidationErrorRejection(
  applicant: { id: string },
  error: unknown
) {
  let errorMessage = 'Error validating headcount availability';
  let errorReason = 'VALIDATION_ERROR';

  if (error instanceof Error) {
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      errorMessage = 'Database connection error during headcount validation';
      errorReason = 'CONNECTION_ERROR';
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      errorMessage = 'Permission denied during headcount validation';
      errorReason = 'PERMISSION_ERROR';
    } else if (error.message.includes('constraint') || error.message.includes('foreign key')) {
      errorMessage = 'Data integrity error during headcount validation';
      errorReason = 'DATA_INTEGRITY_ERROR';
    } else {
      errorMessage = `Headcount validation error: ${error.message}`;
    }
  }

  return {
    applicantId: applicant.id,
    reason: errorReason,
    message: errorMessage,
    headcountStatus: null,
    originalError: error instanceof Error ? error.message : String(error),
  };
}

export async function validateApplicantHiringStatusWithClient(
  client: QueryableClient,
  applicantId: string,
  positionId: string
) {
  try {
    const headcountsResult = await client.query<HeadcountRow>(
      'SELECT id, status, "applicantId" FROM "Headcount" WHERE "positionId" = $1',
      [positionId]
    );
    const headcounts = headcountsResult.rows;

    if (headcounts.length === 0) {
      return {
        canHire: false,
        reason: 'NO_HEADCOUNT',
        message: 'This position has no headcount defined. Cannot hire Applicant without available headcount.',
        headcountStatus: {
          hasHeadcounts: false,
          totalHeadcounts: 0,
          vacantHeadcounts: 0,
          filledHeadcounts: 0,
        },
      };
    }

    const { vacantHeadcounts, filledHeadcounts, summary } = buildHeadcountStatus(headcounts);

    if (vacantHeadcounts.length === 0) {
      return {
        canHire: false,
        reason: 'NO_VACANT_HEADCOUNT',
        message: 'All headcounts for this position are already filled. Cannot hire Applicant without available headcount.',
        headcountStatus: {
          ...summary,
          vacantHeadcounts: 0,
          filledHeadcounts: filledHeadcounts.length,
        },
      };
    }

    const existingAssignment = headcounts.find((headcount) => headcount.applicantId === applicantId);
    if (existingAssignment) {
      return {
        canHire: true,
        reason: 'ALREADY_ASSIGNED',
        message: 'Applicant is already assigned to a headcount.',
        headcountId: existingAssignment.id,
        headcountStatus: summary,
      };
    }

    return {
      canHire: true,
      reason: 'VACANT_HEADCOUNT_AVAILABLE',
      message: 'Vacant headcount available for hiring.',
      availableHeadcountId: vacantHeadcounts[0].id,
      headcountStatus: summary,
    };
  } catch (error) {
    console.error('Error validating Applicant hiring status:', error);
    throw error;
  }
}

export async function assignApplicantToHeadcountWithClient(
  client: QueryableClient,
  applicantId: string,
  positionId: string
) {
  try {
    const vacantHeadcountResult = await client.query<Pick<HeadcountRow, 'id'>>(
      `SELECT id FROM "Headcount"
       WHERE "positionId" = $1 AND (status = 'vacant' OR "applicantId" IS NULL)
       ORDER BY "createdAt" ASC
       LIMIT 1`,
      [positionId]
    );

    if (vacantHeadcountResult.rows.length === 0) {
      return {
        success: false,
        message: 'No vacant headcount available for this position',
      };
    }

    const vacantHeadcountId = vacantHeadcountResult.rows[0].id;

    await client.query(
      'UPDATE "Headcount" SET status = $1, "applicantId" = $2 WHERE id = $3',
      ['filled', applicantId, vacantHeadcountId]
    );

    const autoCloseResult = await maybeCloseFilledPosition(client, positionId);

    return {
      success: true,
      message: 'Applicant automatically assigned to headcount',
      headcountId: vacantHeadcountId,
      autoCloseResult,
    };
  } catch (error) {
    console.error('Error assigning Applicant to headcount:', error);
    throw error;
  }
}

async function maybeCloseFilledPosition(client: QueryableClient, positionId: string) {
  try {
    const allHeadcountsResult = await client.query<HeadcountCountRow>(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 AND "applicantId" IS NOT NULL THEN 1 END) as filled FROM "Headcount" WHERE "positionId" = $2',
      ['filled', positionId]
    );
    const { total, filled } = allHeadcountsResult.rows[0];

    if (parseInt(total) <= 0 || parseInt(total) !== parseInt(filled)) {
      return null;
    }

    await client.query(
      'UPDATE "Position" SET "isOpen" = false, "updatedAt" = NOW() WHERE id = $1',
      [positionId]
    );

    return {
      action: 'closed',
      message: 'Position automatically closed as all headcounts are filled',
    };
  } catch (autoCloseError) {
    console.error('Error auto-closing position:', autoCloseError);
    return null;
  }
}
