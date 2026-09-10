type HeadcountWithAssignmentTargets = {
  applicant: {
    id: string;
    statusId: string | null;
  } | null;
  position: {
    id: string;
  };
};

export function hasAssignedApplicant(
  headcount: unknown,
): headcount is HeadcountWithAssignmentTargets & { applicant: NonNullable<HeadcountWithAssignmentTargets['applicant']> } {
  if (!headcount || typeof headcount !== 'object') {
    return false;
  }

  const candidate = headcount as {
    applicant?: unknown;
    position?: unknown;
  };

  return Boolean(
    candidate.applicant &&
    typeof candidate.applicant === 'object' &&
    typeof (candidate.applicant as { id?: unknown }).id === 'string' &&
    candidate.position &&
    typeof candidate.position === 'object' &&
    typeof (candidate.position as { id?: unknown }).id === 'string',
  );
}

export function shouldResetApplicantStatusAfterUnassign(
  wasHired: boolean | null | undefined,
  remainingHeadcountCount: number,
) {
  return Boolean(wasHired) && remainingHeadcountCount === 0;
}
