/**
 * Score utilities for handling fit scores and letter grades
 * 
 * IMPORTANT: This system handles both decimal (0-1) and integer (0-100) score formats.
 * - Decimal scores (0.55) are automatically converted to percentages (55%)
 * - Integer scores (55) are used as-is
 * - All scores are normalized to 0-100 range for consistent grading
 */

export interface ScoreGrade {
  letter: string;
  range: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
}

const MIN_FIT_SCORE = 0;
const MAX_FIT_SCORE = 100;
const DECIMAL_SCORE_MAX = 1;
const DEFAULT_SCORE_BG_COLOR = 'bg-gray-200';

export const SCORE_GRADES: ScoreGrade[] = [
  { letter: 'A', range: '81-100', min: 81, max: 100, color: 'text-black', bgColor: 'bg-green-200' },
  { letter: 'B', range: '61-80', min: 61, max: 80, color: 'text-black', bgColor: 'bg-lime-200' },
  { letter: 'C', range: '41-60', min: 41, max: 60, color: 'text-black', bgColor: 'bg-yellow-200' },
  { letter: 'D', range: '21-40', min: 21, max: 40, color: 'text-black', bgColor: 'bg-orange-200' },
  { letter: 'E', range: '0-20', min: 0, max: 20, color: 'text-black', bgColor: 'bg-red-200' },
];

function getRoundedScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return null;
  }

  if (!Number.isFinite(score)) {
    return null;
  }

  return score >= MIN_FIT_SCORE && score <= DECIMAL_SCORE_MAX
    ? Math.round(score * MAX_FIT_SCORE)
    : Math.round(score);
}

function normalizeScoreForGrade(score: number | null | undefined) {
  const normalizedScore = getRoundedScore(score);
  if (normalizedScore === null) return null;

  return isScoreInGradeRange(normalizedScore) ? normalizedScore : null;
}

function isScoreInGradeRange(score: number) {
  return score >= MIN_FIT_SCORE && score <= MAX_FIT_SCORE;
}

function clampFitScore(score: number) {
  return Math.max(MIN_FIT_SCORE, Math.min(MAX_FIT_SCORE, score));
}

/**
 * Converts a numeric score to a letter grade
 * @param score - The numeric score (0-100)
 * @returns The letter grade (A, B, C, D, E) or null if score is invalid
 */
export function getScoreGrade(score: number | null | undefined): string | null {
  return getScoreGradeInfo(score)?.letter || null;
}

/**
 * Gets the full grade information for a score
 * @param score - The numeric score (0-100)
 * @returns The ScoreGrade object or null if score is invalid
 */
export function getScoreGradeInfo(score: number | null | undefined): ScoreGrade | null {
  const normalizedScore = normalizeScoreForGrade(score);
  if (normalizedScore === null) return null;

  return SCORE_GRADES.find(g => normalizedScore >= g.min && normalizedScore <= g.max) || null;
}

/**
 * Gets the color class for a score grade
 * @param score - The numeric score (0-100)
 * @returns The color class string or empty string if score is invalid
 */
export function getScoreColor(score: number | null | undefined): string {
  const gradeInfo = getScoreGradeInfo(score);
  return gradeInfo ? gradeInfo.color : '';
}

/**
 * Gets the background color class for a score grade
 * @param score - The numeric score (0-100)
 * @returns The background color class string or empty string if score is invalid
 */
export function getScoreBgColor(score: number | null | undefined): string {
  const gradeInfo = getScoreGradeInfo(score);
  return gradeInfo ? gradeInfo.bgColor : DEFAULT_SCORE_BG_COLOR;
}

/**
 * Formats a score with its letter grade
 * @param score - The numeric score (0-100)
 * @returns Formatted string like "85% (A)" or just "85%" if no grade
 */
export function formatScoreWithGrade(score: number | null | undefined): string {
  const normalizedScore = getRoundedScore(score);
  if (normalizedScore === null) return 'N/A';

  const grade = getScoreGrade(normalizedScore);
  return grade ? `${normalizedScore}% (${grade})` : `${normalizedScore}%`;
}

/**
 * Gets score ranges for dashboard charts with letter grades
 * @returns Array of score ranges with letter grade labels
 */
export function getScoreRangesForChart(): Array<{ label: string; min: number; max: number; letter: string }> {
  return SCORE_GRADES.map(grade => ({
    label: `${grade.letter} (${grade.range})`,
    min: grade.min,
    max: grade.max,
    letter: grade.letter
  }));
}

/**
 * Normalizes a fit score to ensure it's in the correct 0-100 integer format
 * Handles conversion from decimal (0-1) to percentage (0-100)
 * @param score - The raw score value (can be decimal, integer, null, or undefined)
 * @returns Normalized score as integer (0-100)
 */
export function normalizeFitScore(score: number | null | undefined): number {
  const normalizedScore = getRoundedScore(score);
  return normalizedScore === null ? MIN_FIT_SCORE : clampFitScore(normalizedScore);
} 
