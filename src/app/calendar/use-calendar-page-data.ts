import { useCallback, useEffect, useState } from 'react';
import {
  type ApplicantReminder,
  type ApplicantWithEvaluationLink,
} from './calendar-page-utils';
import {
  fetchCalendarApplicantsWithEvaluationLinks,
  fetchCalendarLogoUrl,
  fetchCalendarReminders,
  scheduleCalendarApplicantInterview,
} from './calendar-page-api';

interface UseCalendarPageDataInput {
  sessionStatus: string;
  query?: string | null;
}

export function useCalendarPageData({ sessionStatus, query }: UseCalendarPageDataInput) {
  const [applicants, setApplicants] = useState<ApplicantWithEvaluationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ApplicantReminder[]>([]);
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setIsRemindersLoading(true);
      setReminders(await fetchCalendarReminders());
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setIsRemindersLoading(false);
    }
  }, []);

  const fetchCalendarLogo = useCallback(async () => {
    try {
      setAppLogoUrl(await fetchCalendarLogoUrl());
    } catch (err) {
      console.error('Failed to fetch QR code logo', err);
    }
  }, []);

  const fetchApplicantsWithEvaluationLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setApplicants(await fetchCalendarApplicantsWithEvaluationLinks(query));
    } catch (err) {
      console.error('Error fetching Applicants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Applicants');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const scheduleApplicantInterview = useCallback(async (
    applicantId: string,
    interviewDateTime: string,
  ) => {
    await scheduleCalendarApplicantInterview(applicantId, interviewDateTime);
    setApplicants(await fetchCalendarApplicantsWithEvaluationLinks(query));
  }, [query]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchApplicantsWithEvaluationLinks();
      fetchCalendarLogo();
      fetchReminders();
    }
  }, [sessionStatus, query, fetchApplicantsWithEvaluationLinks, fetchCalendarLogo, fetchReminders]);

  return {
    applicants,
    appLogoUrl,
    error,
    fetchApplicantsWithEvaluationLinks,
    fetchReminders,
    isLoading,
    isRemindersLoading,
    reminders,
    scheduleApplicantInterview,
  };
}
