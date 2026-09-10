import type { CombinedActivityItem } from './applicant-comments-types';

function getCommentOrActivityAuthorName(author: CombinedActivityItem['author']) {
  if (typeof author === 'object' && author !== null && 'name' in author) {
    return author.name;
  }

  return author || 'Unknown';
}

export function getApplicantActivityAuthorName(item: CombinedActivityItem) {
  if (item.type === 'comment' || item.type === 'activity') {
    return getCommentOrActivityAuthorName(item.author);
  }

  return item.user || 'System';
}

export function getApplicantCommentAttachments(item: CombinedActivityItem) {
  return Array.isArray(item.attachments) ? item.attachments : [];
}
