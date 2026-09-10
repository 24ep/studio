import type {
  ApplicantCommentsTab,
  CombinedActivityItem,
} from './applicant-comments-types';
export {
  buildCombinedApplicantActivities,
  getApplicantActivityAuthorName,
  getApplicantCommentAttachments,
  getCombinedApplicantActivityDate,
} from './applicant-comments-activity-builders';

const APPLICANT_ACTIVITY_TAB_TYPES: Record<ApplicantCommentsTab, ReadonlySet<string>> = {
  all: new Set(),
  activity: new Set(['activity', 'reminder']),
  comment: new Set(['', 'comment']),
  remark: new Set(['remark', 'reminder']),
};

export function filterCombinedApplicantActivities(
  activities: CombinedActivityItem[],
  activeSubTab: ApplicantCommentsTab,
) {
  const allowedTypes = APPLICANT_ACTIVITY_TAB_TYPES[activeSubTab] ?? APPLICANT_ACTIVITY_TAB_TYPES.all;
  if (allowedTypes.size === 0) {
    return activities;
  }

  return activities.filter(item => allowedTypes.has(item.rawType || ''));
}

const APPLICANT_ACTIVITY_HAS_MORE_SELECTORS: Record<ApplicantCommentsTab, (input: {
  hasMoreActivities: boolean;
  hasMoreComments: boolean;
}) => boolean> = {
  all: ({ hasMoreActivities, hasMoreComments }) => hasMoreComments || hasMoreActivities,
  activity: ({ hasMoreActivities }) => hasMoreActivities,
  comment: ({ hasMoreComments }) => hasMoreComments,
  remark: ({ hasMoreComments }) => hasMoreComments,
};

function hasMoreApplicantActivityDataToFetch({
  activeSubTab,
  hasMoreActivities,
  hasMoreComments,
}: {
  activeSubTab: ApplicantCommentsTab;
  hasMoreActivities: boolean;
  hasMoreComments: boolean;
}) {
  const selectHasMore = APPLICANT_ACTIVITY_HAS_MORE_SELECTORS[activeSubTab] ??
    APPLICANT_ACTIVITY_HAS_MORE_SELECTORS.all;

  return selectHasMore({ hasMoreActivities, hasMoreComments });
}

export function getCombinedApplicantActivityViewState({
  activities,
  activeSubTab,
  displayedItems,
  hasMoreComments,
  hasMoreActivities,
}: {
  activities: CombinedActivityItem[];
  activeSubTab: ApplicantCommentsTab;
  displayedItems: number;
  hasMoreComments: boolean;
  hasMoreActivities: boolean;
}) {
  const filteredActivities = filterCombinedApplicantActivities(activities, activeSubTab);
  const combinedActivities = filteredActivities.slice(0, displayedItems);
  const hasMoreItemsInView = displayedItems < filteredActivities.length;
  const hasMoreDataToFetch = hasMoreApplicantActivityDataToFetch({
    activeSubTab,
    hasMoreActivities,
    hasMoreComments,
  });

  return {
    filteredActivities,
    combinedActivities,
    hasMoreItems: hasMoreItemsInView || hasMoreDataToFetch,
  };
}
