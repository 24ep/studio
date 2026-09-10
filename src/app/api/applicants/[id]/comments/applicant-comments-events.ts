import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { dispatchWebhooks } from '@/lib/webhookDispatcher';

type ApplicantCommentEventPayload = Record<string, unknown> & {
  id: string;
  author?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

function withAuthorName(comment: ApplicantCommentEventPayload) {
  return {
    ...comment,
    author_name: comment.author?.name || comment.author?.email || 'Unknown',
  };
}

export async function publishApplicantCommentCreated(
  applicantId: string,
  comment: ApplicantCommentEventPayload,
  userId: string
) {
  broadcastApplicantUpdate({ id: applicantId, comment, action: 'comment_added' }, userId);

  try {
    await dispatchWebhooks.commentCreated(withAuthorName(comment));
  } catch (webhookError) {
    console.error('Failed to dispatch comment creation webhook:', webhookError);
  }
}

export async function publishApplicantCommentUpdated(
  applicantId: string,
  comment: ApplicantCommentEventPayload,
  userId: string
) {
  broadcastApplicantUpdate({ id: applicantId, comment, action: 'comment_updated' }, userId);

  try {
    await dispatchWebhooks.commentUpdated(withAuthorName(comment));
  } catch (webhookError) {
    console.error('Failed to dispatch comment update webhook:', webhookError);
  }
}

export async function publishApplicantCommentDeleted(
  applicantId: string,
  comment: ApplicantCommentEventPayload,
  userId: string
) {
  broadcastApplicantUpdate({ id: applicantId, comment: { id: comment.id }, action: 'comment_deleted' }, userId);

  try {
    await dispatchWebhooks.commentDeleted({
      ...comment,
      author_name: 'Unknown',
    });
  } catch (webhookError) {
    console.error('Failed to dispatch comment deletion webhook:', webhookError);
  }
}
