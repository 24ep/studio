import type { ApplicantCommentChannel } from './applicant-comments-types';

export function createOptimisticApplicantComment({
  content,
  channel,
  files,
  labels,
  now = new Date(),
}: {
  content: string;
  channel: ApplicantCommentChannel;
  files: File[];
  labels: string[];
  now?: Date;
}) {
  const timestamp = now.getTime();

  return {
    id: `temp-${timestamp}`,
    content,
    type: channel,
    rawType: channel,
    author: { name: 'You' },
    createdAt: now.toISOString(),
    attachments: files.map((file, idx) => ({
      id: `temp-attachment-${timestamp}-${idx}`,
      fileName: file.name,
      label: labels[idx],
      url: URL.createObjectURL(file),
    })),
  };
}

export function getOriginalCommentId(combinedActivityId: string) {
  return combinedActivityId.replace('comment-', '');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getCommentSubmitErrorMessage(error: unknown) {
  const errorMessage = getErrorMessage(error, 'Failed to add comment');

  if (errorMessage.includes('MinIO') || errorMessage.includes('bucket') || errorMessage.includes('storage')) {
    return 'File storage service is not available. Please try again later or contact support.';
  }

  if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
    return 'Server error occurred. Please try again later.';
  }

  return errorMessage;
}
