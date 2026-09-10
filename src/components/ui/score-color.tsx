// Shared fit score color logic for all components

import React from 'react';

export interface ScoreColorInfo {
  label: string;
  min: number;
  max: number;
  bg: string;
  text: string;
}

export const SCORE_COLOR_STOPS: ScoreColorInfo[] = [
  { label: 'E (0-20)', min: 0, max: 20, bg: 'bg-red-400', text: 'text-white' },
  { label: 'D (21-40)', min: 21, max: 40, bg: 'bg-orange-400', text: 'text-black' },
  { label: 'C (41-60)', min: 41, max: 60, bg: 'bg-yellow-200', text: 'text-black' },
  { label: 'B (61-80)', min: 61, max: 80, bg: 'bg-yellow-400', text: 'text-black' },
  { label: 'A (81-100)', min: 81, max: 100, bg: 'bg-lime-400', text: 'text-black' },
];

export function getScoreColorInfo(score: number | null | undefined): ScoreColorInfo {
  let normalized = 0;
  if (score === null || score === undefined || isNaN(Number(score))) return SCORE_COLOR_STOPS[0];
  if (score > 0 && score <= 1) normalized = Math.round(score * 100);
  else normalized = Math.round(score);
  for (const stop of SCORE_COLOR_STOPS) {
    if (normalized >= stop.min && normalized <= stop.max) return stop;
  }
  return SCORE_COLOR_STOPS[0];
}

export function ScoreBadge({ score, className = '', children }: { score: number | null | undefined, className?: string, children?: React.ReactNode }) {
  const info = getScoreColorInfo(score);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.text} ${className}`}>
      {children ?? info.label}
    </span>
  );
} 