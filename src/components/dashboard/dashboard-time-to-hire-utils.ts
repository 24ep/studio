import { parseISO } from 'date-fns';

import type { Applicant } from '../../lib/types';

function parseValidIsoDate(value: string) {
  const parsedDate = parseISO(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function compareTransitionDatesDescending(
  itemA: Applicant['transitionHistory'][number],
  itemB: Applicant['transitionHistory'][number]
) {
  const dateA = new Date(itemA.date);
  const dateB = new Date(itemB.date);
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) return 0;
  return dateB.getTime() - dateA.getTime();
}

function getLatestHiredTransition(applicant: Applicant, hiredStageId?: string) {
  return (Array.isArray(applicant.transitionHistory) ? applicant.transitionHistory : [])
    .filter(transition => hiredStageId && transition.stage === hiredStageId)
    .sort(compareTransitionDatesDescending)[0];
}

export function getApplicantDaysToHire(applicant: Applicant, hiredStageId?: string) {
  try {
    const applicationDate = parseValidIsoDate(applicant.applicationDate);
    if (!applicationDate) return 0;

    const hiredTransition = getLatestHiredTransition(applicant, hiredStageId);
    const hireDate = hiredTransition ? parseValidIsoDate(hiredTransition.date) : null;
    if (!hireDate) return 0;

    const daysDiff = Math.ceil((hireDate.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff);
  } catch {
    return 0;
  }
}
