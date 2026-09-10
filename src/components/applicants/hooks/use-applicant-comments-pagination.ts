import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  fetchApplicantCommentsPage,
  type ApplicantCommentsPage,
} from '../applicant-comments-api';
import type { ApplicantCommentItem } from '../applicant-comments-utils';
import type { ApplicantCommentsCounts } from './use-applicant-reminders';
import { COMMENTS_PER_LOAD } from './applicant-comments-feed-constants';

interface UseApplicantCommentsPaginationParams {
  applicantId: string;
  initialComments: ApplicantCommentItem[];
  setCounts: Dispatch<SetStateAction<ApplicantCommentsCounts>>;
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error !== null &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError')
  );
}

export function useApplicantCommentsPagination({
  applicantId,
  initialComments,
  setCounts,
}: UseApplicantCommentsPaginationParams) {
  const [comments, setComments] = useState<ApplicantCommentItem[]>(initialComments);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const applyCommentsPage = useCallback((page: ApplicantCommentsPage) => {
    setComments(page.comments);
    setCommentsOffset(page.comments.length);
    setHasMoreComments(page.hasMore);
    setCounts(prev => ({
      ...prev,
      all: page.totalComments + page.totalRemarks + prev.activity,
      comment: page.totalComments,
      remark: page.totalRemarks,
    }));
  }, [setCounts]);

  const refreshFirstCommentsPage = useCallback(async () => {
    const page = await fetchApplicantCommentsPage({
      applicantId,
      limit: COMMENTS_PER_LOAD,
      offset: 0,
    });

    if (page) {
      applyCommentsPage(page);
    }
  }, [applicantId, applyCommentsPage]);

  useEffect(() => {
    mountedRef.current = true;

    const loadInitialComments = async () => {
      try {
        const page = await fetchApplicantCommentsPage({
          applicantId,
          limit: COMMENTS_PER_LOAD,
          offset: 0,
        });

        if (!mountedRef.current) return;

        if (page) {
          applyCommentsPage(page);
        } else {
          setComments(Array.isArray(initialComments) ? initialComments : []);
          setCommentsOffset(0);
          setHasMoreComments(true);
        }
      } catch (error) {
        if (!mountedRef.current) return;

        console.error('Error loading initial comments:', error);
        setComments(Array.isArray(initialComments) ? initialComments : []);
        setCommentsOffset(0);
        setHasMoreComments(true);
      }
    };

    loadInitialComments();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [applicantId, applyCommentsPage, initialComments]);

  const loadMoreComments = useCallback(async () => {
    if (loadingMore || !hasMoreComments) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoadingMore(true);
    try {
      const page = await fetchApplicantCommentsPage({
        applicantId,
        limit: COMMENTS_PER_LOAD,
        offset: commentsOffset,
        signal: abortControllerRef.current.signal,
      });

      if (!mountedRef.current || !page) return;

      if (page.comments.length > 0) {
        setComments(prev => [...prev, ...page.comments]);
        setCommentsOffset(prev => prev + page.comments.length);
        setHasMoreComments(page.hasMore);
      } else {
        setHasMoreComments(false);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error loading more comments:', error);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [applicantId, commentsOffset, hasMoreComments, loadingMore]);

  return {
    comments,
    hasMoreComments,
    loadMoreComments,
    loadingMore,
    refreshFirstCommentsPage,
    setComments,
  };
}
