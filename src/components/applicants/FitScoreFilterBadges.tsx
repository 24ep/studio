"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getScoreRangesForChart } from '@/lib/scoreUtils';
import { cn } from '@/lib/utils';

interface FitScoreFilterBadgesProps {
  selectedGrades: Set<string>;
  onGradeToggle: (grade: string) => void;
  applicantCounts?: Array<{ letter: string; count: number }>;
  title?: string;
  className?: string;
  filterMode?: 'single' | 'multi';
}

export function FitScoreFilterBadges({
  selectedGrades,
  onGradeToggle,
  applicantCounts = [],
  title = "Fit Score Filter",
  className,
  filterMode = 'multi'
}: FitScoreFilterBadgesProps) {
  const scoreRanges = getScoreRangesForChart();

  // Color gradient from dark blue to light blue
  const getGradeColor = (letter: string) => {
    switch (letter) {
      case 'A':
        return 'border-blue-900 bg-blue-900 text-white hover:bg-blue-800 dark:border-blue-400 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-300';
      case 'B':
        return 'border-blue-700 bg-blue-700 text-white hover:bg-blue-600 dark:border-blue-500 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400';
      case 'C':
        return 'border-blue-500 bg-blue-500 text-white hover:bg-blue-400 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500';
      case 'D':
        return 'border-blue-300 bg-blue-300 text-blue-900 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-200 dark:hover:bg-blue-900';
      case 'E':
        return 'border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-950';
      default:
        return 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground';
    }
  };

  const getCount = (letter: string) => {
    return applicantCounts.find(c => c.letter === letter)?.count || 0;
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{title}:</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {scoreRanges.map((grade) => {
          const isSelected = selectedGrades.has(grade.letter);
          const count = getCount(grade.letter);
          
          return (
            <Badge
              key={grade.letter}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105 relative text-xs px-2 py-1",
                isSelected 
                  ? getGradeColor(grade.letter)
                  : "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              )}
              onClick={() => {
                if (filterMode === 'single') {
                  // In single mode, clear all other selections first
                  selectedGrades.forEach(selectedGrade => {
                    if (selectedGrade !== grade.letter) {
                      onGradeToggle(selectedGrade);
                    }
                  });
                }
                onGradeToggle(grade.letter);
              }}
            >
              {grade.letter} ({grade.min}-{grade.max})
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 text-xs px-1 py-0.5 h-4 min-w-4 flex items-center justify-center",
                  isSelected
                    ? "bg-white/20 text-white border-white/30"
                    : "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                )}
              >
                {count}
              </Badge>
            </Badge>
          );
        })}
        
        {/* No Score Option */}
        <Badge
          variant={selectedGrades.has('no-score') ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:scale-105 relative text-xs px-2 py-1",
            selectedGrades.has('no-score')
              ? "border-gray-700 bg-gray-700 text-white hover:bg-gray-600 dark:border-gray-300 dark:bg-gray-300 dark:text-gray-950 dark:hover:bg-gray-200"
              : "hover:border-border hover:bg-muted hover:text-foreground"
          )}
          onClick={() => {
            if (filterMode === 'single') {
              // In single mode, clear all other selections first
              selectedGrades.forEach(selectedGrade => {
                if (selectedGrade !== 'no-score') {
                  onGradeToggle(selectedGrade);
                }
              });
            }
            onGradeToggle('no-score');
          }}
        >
          No Score
          <Badge
            variant="secondary"
            className={cn(
              "ml-1 text-xs px-1 py-0.5 h-4 min-w-4 flex items-center justify-center",
              selectedGrades.has('no-score')
                ? "bg-white/20 text-white border-white/30"
                : "border-border bg-muted text-muted-foreground"
            )}
          >
            {getCount('no-score')}
          </Badge>
        </Badge>
      </div>
    </div>
  );
}
