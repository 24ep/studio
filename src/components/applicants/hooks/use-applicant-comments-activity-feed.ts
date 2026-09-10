import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  buildCombinedApplicantActivities,
  getCombinedApplicantActivityViewState,
  type ApplicantCommentItem,
  type ApplicantReminderItem,
  type ApplicantCommentsTab,
} from '../applicant-comments-utils';
import type { ApplicantCommentsCounts } from './use-applicant-reminders';
import {
  INITIAL_DISPLAYED_ITEMS,
  ITEMS_PER_LOAD,
} from './applicant-comments-feed-constants';
import { useApplicantActivitiesPagination } from './use-applicant-activities-pagination';
import { useApplicantCommentsPagination } from './use-applicant-comments-pagination';

interface UseApplicantCommentsActivityFeedParams {
  applicantId: string;
  activeSubTab: ApplicantCommentsTab;
  initialComments: ApplicantCommentItem[];
  reminders: ApplicantReminderItem[];
  setCounts: Dispatch<SetStateAction<ApplicantCommentsCounts>>;
}

export function useApplicantCommentsActivityFeed({
  applicantId,
  activeSubTab,
  initialComments,
  reminders,
  setCounts,
}: UseApplicantCommentsActivityFeedParams) {
  const [displayedItems, setDisplayedItems] = useState(INITIAL_DISPLAYED_ITEMS);
  const {
    comments,
    hasMoreComments,
    loadMoreComments,
    loadingMore,
    refreshFirstCommentsPage,
    setComments,
  } = useApplicantCommentsPagination({
    applicantId,
    initialComments,
    setCounts,
  });
  const {
    hasMoreActivities,
    loadingMoreActivities,
    loadMoreActivities,
    logs,
    logsLoading,
  } = useApplicantActivitiesPagination({
    applicantId,
    setCounts,
  });

  const loadMoreItems = useCallback(async () => {
    const currentComments = Array.isArray(comments) ? comments : [];
    const currentActivities = Array.isArray(logs) ? logs : [];
    const totalCurrentItems = currentComments.length + currentActivities.length;

    if (displayedItems >= totalCurrentItems) {
      if (hasMoreComments && !loadingMore) {
        await loadMoreComments();
      } else if (hasMoreActivities && !loadingMoreActivities) {
        await loadMoreActivities();
      }
    }

    setDisplayedItems(prev => prev + ITEMS_PER_LOAD);
  }, [
    comments,
    displayedItems,
    hasMoreActivities,
    hasMoreComments,
    loadingMore,
    loadingMoreActivities,
    loadMoreActivities,
    loadMoreComments,
    logs,
  ]);

  const allCombinedActivities = buildCombinedApplicantActivities({
    comments,
    logs,
    reminders,
  });

  const { combinedActivities, hasMoreItems } = getCombinedApplicantActivityViewState({
    activities: allCombinedActivities,
    activeSubTab,
    displayedItems,
    hasMoreComments,
    hasMoreActivities,
  });

  return {
    combinedActivities,
    comments,
    hasMoreItems,
    isLoadingMore: loadingMore || loadingMoreActivities,
    loadMoreItems,
    logsLoading,
    refreshFirstCommentsPage,
    setComments,
  };
}
