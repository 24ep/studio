export type LearningAssignmentSubmissionLike = { status?: unknown; feedback?: unknown } | null;

export function assignmentViewModel(submission: LearningAssignmentSubmissionLike) {
  if (!submission) return { state: 'not_submitted' as const, label: 'Ready to submit', actionLabel: 'Submit assignment', canSubmit: true, feedback: null };
  const status = String(submission.status ?? '').toLowerCase();
  const feedback = typeof submission.feedback === 'string' && submission.feedback.trim() ? submission.feedback.trim() : null;
  if (status === 'pending') return { state: 'pending' as const, label: 'Awaiting review', actionLabel: null, canSubmit: false, feedback };
  if (status === 'changes_requested') return { state: 'changes_requested' as const, label: 'Changes requested', actionLabel: 'Resubmit', canSubmit: true, feedback };
  if (status === 'approved') return { state: 'approved' as const, label: 'Approved', actionLabel: null, canSubmit: false, feedback };
  return { state: 'unknown' as const, label: 'Review status unavailable', actionLabel: null, canSubmit: false, feedback };
}
