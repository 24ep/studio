"use client";

import React from 'react';
import { getScoreRangesForChart } from '@/lib/scoreUtils';
import {
  getMobileFitScoreGradeColor,
  MobileFitScoreFilterPill,
} from './ApplicantsPageMobileFitScoreFilterParts';

interface ApplicantsPageMobileFitScoreFilterProps {
  selectedGrades: Set<string>;
  onGradeToggle: (grade: string) => void;
  applicantCounts: Array<{ letter: string; count: number }>;
  filterMode?: 'single' | 'multi';
  onClearAll?: () => void;
  aiMatchedCount?: number;
  isAiSearchActive?: boolean;
  fitScoreType: 'applied' | 'matching';
}

export function ApplicantsPageMobileFitScoreFilter({
  selectedGrades,
  onGradeToggle,
  applicantCounts = [],
  filterMode = 'multi',
  onClearAll,
  aiMatchedCount = 0,
  isAiSearchActive = false,
  fitScoreType,
}: ApplicantsPageMobileFitScoreFilterProps) {
  const scoreRanges = getScoreRangesForChart();
  const safeSelectedGrades = selectedGrades || new Set<string>();

  const getCount = (letter: string): number => {
    if (!Array.isArray(applicantCounts)) return 0;
    const count = applicantCounts.find(c => c.letter === letter)?.count || 0;
    return count;
  };

  const getTotalCount = (): number => {
    if (isAiSearchActive && aiMatchedCount > 0) {
      return aiMatchedCount;
    }
    if (!Array.isArray(applicantCounts)) return 0;
    const total = applicantCounts.reduce((total, item) => total + (item?.count || 0), 0);
    return total;
  };

  const isAllSelected = !safeSelectedGrades || safeSelectedGrades.size === 0;

  const handleGradeClick = (grade: string) => {
    if (filterMode === 'single') {
      if (safeSelectedGrades && safeSelectedGrades.size > 0) {
        safeSelectedGrades.forEach(selectedGrade => {
          if (selectedGrade !== grade) {
            onGradeToggle(selectedGrade);
          }
        });
      }
    }
    onGradeToggle(grade);
  };

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <MobileFitScoreFilterPill
          count={getTotalCount()}
          isSelected={isAllSelected}
          label={isAiSearchActive && aiMatchedCount > 0 ? "AI Matched" : "All"}
          onClick={onClearAll}
          toneClassName={
            isAllSelected
              ? "bg-blue-800 text-white border-blue-800 active:bg-blue-900"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted active:bg-muted/80"
          }
        />

        {scoreRanges.map((grade) => {
          const isSelected = safeSelectedGrades.has(grade.letter);
          return (
            <MobileFitScoreFilterPill
              key={grade.letter}
              count={getCount(grade.letter)}
              isSelected={isSelected}
              label={grade.letter}
              onClick={() => handleGradeClick(grade.letter)}
              toneClassName={getMobileFitScoreGradeColor(grade.letter, isSelected)}
            />
          );
        })}

        <MobileFitScoreFilterPill
          count={getCount('no-score')}
          isSelected={safeSelectedGrades.has('no-score')}
          label="N/A"
          onClick={() => handleGradeClick('no-score')}
          toneClassName={getMobileFitScoreGradeColor('no-score', safeSelectedGrades.has('no-score'))}
        />
      </div>
    </div>
  );
}

