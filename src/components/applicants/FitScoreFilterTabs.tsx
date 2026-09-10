"use client";

import { useCallback, useMemo } from 'react';

import { getScoreRangesForChart } from '@/lib/scoreUtils';
import { cn } from '@/lib/utils';
import { FitScoreFilterTabButton } from './FitScoreFilterTabButton';
import {
  getFitScoreCount,
  getFitScoreTotalCount,
  getSafeFitScoreSelectedGrades,
  toggleFitScoreGrade,
} from './fit-score-filter-tabs-utils';

interface FitScoreFilterTabsProps {
  selectedGrades?: Set<string>;
  onGradeToggle: (grade: string) => void;
  applicantCounts?: Array<{ letter: string; count: number }>;
  className?: string;
  filterMode?: 'single' | 'multi';
  onClearAll?: () => void;
  aiMatchedCount?: number;
  isAiSearchActive?: boolean;
}

export function FitScoreFilterTabs({
  selectedGrades,
  onGradeToggle,
  applicantCounts = [],
  className,
  filterMode = 'multi',
  onClearAll,
  aiMatchedCount = 0,
  isAiSearchActive = false,
}: FitScoreFilterTabsProps) {
  const scoreRanges = getScoreRangesForChart();
  const safeSelectedGrades = useMemo(() => (
    getSafeFitScoreSelectedGrades(selectedGrades)
  ), [selectedGrades]);
  const isAllSelected = safeSelectedGrades.size === 0;

  const safeOnGradeToggle = useCallback((grade: string) => {
    if (typeof onGradeToggle === 'function') {
      onGradeToggle(grade);
    }
  }, [onGradeToggle]);

  const safeOnClearAll = useCallback(() => {
    if (typeof onClearAll === 'function') {
      onClearAll();
    }
  }, [onClearAll]);

  const handleGradeClick = useCallback((grade: string) => {
    toggleFitScoreGrade({
      filterMode,
      grade,
      onGradeToggle: safeOnGradeToggle,
      selectedGrades: safeSelectedGrades,
    });
  }, [filterMode, safeOnGradeToggle, safeSelectedGrades]);

  return (
    <div className={cn('w-full', className)}>
      <div
        role="group"
        aria-label="Filter applicants by fit score"
        className="flex w-max min-w-full items-center overflow-x-auto rounded-[6px] border border-[#d9dfe7] bg-white scrollbar-hide dark:border-zinc-700 dark:bg-zinc-900"
      >
        <FitScoreFilterTabButton
          active={isAllSelected}
          count={getFitScoreTotalCount({
            aiMatchedCount,
            counts: applicantCounts,
            isAiSearchActive,
          })}
          grade="all"
          marker={isAiSearchActive && aiMatchedCount > 0 ? 'AI' : 'ALL'}
          onClick={safeOnClearAll}
          range={isAiSearchActive && aiMatchedCount > 0 ? 'Matched' : '0–100'}
        />

        {scoreRanges.map((grade) => (
          <FitScoreFilterTabButton
            key={grade.letter}
            active={safeSelectedGrades.has(grade.letter)}
            count={getFitScoreCount(applicantCounts, grade.letter)}
            grade={grade.letter as 'A' | 'B' | 'C' | 'D' | 'E'}
            marker={grade.letter}
            onClick={() => handleGradeClick(grade.letter)}
            range={`${grade.min}–${grade.max}`}
          />
        ))}

        <FitScoreFilterTabButton
          active={safeSelectedGrades.has('no-score')}
          count={getFitScoreCount(applicantCounts, 'no-score')}
          grade="no-score"
          marker="—"
          onClick={() => handleGradeClick('no-score')}
          range="No score"
        />
      </div>
    </div>
  );
}
