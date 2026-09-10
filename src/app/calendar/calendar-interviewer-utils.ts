import type { CalendarInterviewer, InterviewerPayload } from './calendar-page-types';

export function toggleCalendarInterviewerSelection(
  currentIds: Set<string>,
  interviewerId: string,
  checked: boolean,
) {
  const nextIds = new Set(currentIds);

  if (checked) {
    nextIds.add(interviewerId);
  } else {
    nextIds.delete(interviewerId);
  }

  return nextIds;
}

export function normalizeInterviewers(payload: unknown): CalendarInterviewer[] {
  return Array.isArray(payload)
    ? payload
        .filter(
          (item): item is InterviewerPayload =>
            !!item &&
            typeof item === 'object' &&
            typeof (item as InterviewerPayload).id === 'string',
        )
        .map((item) => ({
          id: item.id as string,
          name:
            typeof item.name === 'string'
              ? item.name
              : typeof item.email === 'string'
                ? item.email
                : 'Unknown',
          email: typeof item.email === 'string' ? item.email : undefined,
        }))
    : [];
}
