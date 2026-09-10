import type { CSSProperties } from 'react';
import type { EvaluationSummary, Interviewer } from './types';
import type { EvaluateThemeStyle } from './DesktopEvaluatePagePartTypes';

export function buildEvaluateHeaderStyle({
  evaluateHeaderBackgroundType,
  evaluateHeaderBackgroundImage,
  evaluateHeaderBackgroundGradient,
  evaluateHeaderBackgroundColor,
  evaluateHeaderTextColor,
}: EvaluateThemeStyle): CSSProperties {
  return {
    background: evaluateHeaderBackgroundType === 'image' && evaluateHeaderBackgroundImage
      ? `url(${evaluateHeaderBackgroundImage})`
      : evaluateHeaderBackgroundType === 'gradient'
        ? evaluateHeaderBackgroundGradient || 'linear-gradient(135deg, hsl(179 67% 66%), hsl(238 74% 61%))'
        : `hsl(${evaluateHeaderBackgroundColor})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: evaluateHeaderTextColor,
    border: 'none',
  };
}

export function areAllEvaluationsComplete(
  interviewers: Interviewer[],
  allEvaluations: Map<string, EvaluationSummary>
) {
  if (interviewers.length === 0) return false;

  return interviewers.every((interviewer) => {
    const evaluation = allEvaluations.get(interviewer.userId);
    return (evaluation?.personalityScores?.length ?? 0) > 0;
  });
}
