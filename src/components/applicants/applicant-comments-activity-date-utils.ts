import type { CombinedActivityItem } from './applicant-comments-types';

function getCombinedActivityDate(item: CombinedActivityItem) {
  return item.createdAt || item.time || '';
}

function getActivityTimestamp(item: CombinedActivityItem) {
  const date = getCombinedActivityDate(item);
  if (!date) return null;

  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function compareCombinedActivityDateDescending(
  itemA: CombinedActivityItem,
  itemB: CombinedActivityItem
) {
  const timestampA = getActivityTimestamp(itemA);
  const timestampB = getActivityTimestamp(itemB);
  if (timestampA === null || timestampB === null) return 0;

  return timestampB - timestampA;
}

export function getCombinedApplicantActivityDate(item: CombinedActivityItem) {
  return getCombinedActivityDate(item);
}
