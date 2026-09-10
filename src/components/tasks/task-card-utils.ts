import { getScoreColorInfo } from '../ui/score-color';

const TASK_SCORE_BORDER_COLOR_MAP: Record<string, string> = {
  'bg-red-400': 'border-l-red-400',
  'bg-orange-400': 'border-l-orange-400',
  'bg-yellow-200': 'border-l-yellow-200',
  'bg-yellow-400': 'border-l-yellow-400',
  'bg-lime-400': 'border-l-lime-400',
};

export function getTaskFitScoreBorderClass(score?: number | null) {
  if (score === undefined || score === null) {
    return 'border-l-gray-300 dark:border-l-gray-600';
  }

  const colorInfo = getScoreColorInfo(score);
  return TASK_SCORE_BORDER_COLOR_MAP[colorInfo.bg] || 'border-l-gray-300 dark:border-l-gray-600';
}

export function isTaskCardKeyboardActivationKey(key: string) {
  return key === 'Enter' || key === ' ';
}
