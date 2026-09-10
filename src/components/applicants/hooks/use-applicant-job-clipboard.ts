import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant, Position } from '@/lib/types';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import { normalizeApplicantJustification, type ApplicantJobMatchLike } from '../full-applicant-detail-utils';

type ClipboardJobMatch = ApplicantJobMatchLike & {
  positionTitle?: string | null;
};

interface UseApplicantJobClipboardInput {
  applicant: Applicant | null;
  allDbPositions: Position[];
  isJobMatchEnabled: boolean;
  setCopiedJobApplied: Dispatch<SetStateAction<boolean>>;
  setCopiedJobMatchIndex: Dispatch<SetStateAction<number | null>>;
}

function getClipboardJobMatchFitScore(match: ApplicantJobMatchLike) {
  return typeof match.fitScore === 'number' && Number.isFinite(match.fitScore) ? match.fitScore : null;
}

function getClipboardJobMatchReasons(match: ApplicantJobMatchLike) {
  return Array.isArray(match.matchReasons)
    ? match.matchReasons.filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0)
    : [];
}

export function useApplicantJobClipboard({
  applicant,
  allDbPositions,
  isJobMatchEnabled,
  setCopiedJobApplied,
  setCopiedJobMatchIndex,
}: UseApplicantJobClipboardInput) {
  const copiedJobAppliedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copiedJobMatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copiedJobAppliedTimeoutRef.current) {
        clearTimeout(copiedJobAppliedTimeoutRef.current);
      }
      if (copiedJobMatchTimeoutRef.current) {
        clearTimeout(copiedJobMatchTimeoutRef.current);
      }
    };
  }, []);

  const copyJobAppliedToClipboard = async () => {
    if (!applicant?.positionId) return;

    const position = Array.isArray(allDbPositions) ? allDbPositions.find(p => p.id === applicant.positionId) : null;
    const jobTitle = position?.title || 'Unknown Position';
    const fitScore = formatScoreWithGrade(applicant.fitScore);
    const justification = normalizeApplicantJustification(applicant.assignmentJustification);

    const textToCopy = `Job Applied: ${jobTitle}\nFit Score: ${fitScore}\nJustification:\n- ${justification.join('\n- ')}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedJobApplied(true);

      if (copiedJobAppliedTimeoutRef.current) {
        clearTimeout(copiedJobAppliedTimeoutRef.current);
      }

      copiedJobAppliedTimeoutRef.current = setTimeout(() => setCopiedJobApplied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const copyJobMatchToClipboard = async (match: ClipboardJobMatch, index: number) => {
    if (!isJobMatchEnabled) return;

    const position = Array.isArray(allDbPositions)
      ? allDbPositions.find(p => p.id === match.jobId) || allDbPositions.find(p => p.title === match.jobTitle)
      : null;

    const displayTitle = position?.title || match.jobTitle || match.positionTitle || 'Unknown Position';
    const normalizedFitScore = getClipboardJobMatchFitScore(match);
    const fitScore = normalizedFitScore !== null
      ? `${formatScoreWithGrade(normalizedFitScore)}`
      : 'Not set';
    const matchReasons = getClipboardJobMatchReasons(match);
    const matchReasonsText = matchReasons.length > 0
      ? matchReasons.join('\n- ')
      : 'No match reasons provided';

    const textToCopy = `Job Match: ${displayTitle}\nFit Score: ${fitScore}\nMatch Reasons:\n- ${matchReasonsText}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedJobMatchIndex(index);

      if (copiedJobMatchTimeoutRef.current) {
        clearTimeout(copiedJobMatchTimeoutRef.current);
      }

      copiedJobMatchTimeoutRef.current = setTimeout(() => setCopiedJobMatchIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return {
    copyJobAppliedToClipboard,
    copyJobMatchToClipboard,
  };
}
