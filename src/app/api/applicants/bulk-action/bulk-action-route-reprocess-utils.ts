type ReprocessAttachment = {
  label?: string | null;
  [key: string]: unknown;
};

export function selectReprocessAttachment<TAttachment extends ReprocessAttachment>(attachments: TAttachment[] = []) {
  return attachments.find((attachment) => {
    return attachment.label && attachment.label.toLowerCase() === 'resume';
  }) ?? attachments[0] ?? null;
}

export function resolveReprocessPositionId(applicant: {
  positionId?: string | null;
  parsedData?: {
    job_applied?: {
      jobId?: string | null;
    } | null;
  } | null;
}) {
  return applicant.parsedData?.job_applied?.jobId || applicant.positionId || null;
}
