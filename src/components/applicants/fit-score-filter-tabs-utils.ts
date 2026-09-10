export interface FitScoreCount {
  letter: string;
  count: number;
}

const GRADE_BORDER_COLORS: Record<string, string> = {
  A: 'bg-blue-800',
  B: 'bg-blue-600',
  C: 'bg-blue-500',
  D: 'bg-blue-400',
  E: 'bg-blue-300',
  'no-score': 'bg-gray-400',
};

const GRADE_TEXT_COLORS: Record<string, string> = {
  A: 'text-blue-800',
  B: 'text-blue-600',
  C: 'text-blue-500',
  D: 'text-blue-400',
  E: 'text-blue-300',
  'no-score': 'text-gray-600',
};

export function getSafeFitScoreSelectedGrades(selectedGrades?: Set<string>) {
  return selectedGrades instanceof Set ? selectedGrades : new Set<string>();
}

export function getFitScoreCount(counts: FitScoreCount[] | undefined, letter: string) {
  if (!Array.isArray(counts)) {
    return 0;
  }

  return counts.find((count) => count.letter === letter)?.count || 0;
}

export function getFitScoreTotalCount({
  aiMatchedCount,
  counts,
  isAiSearchActive,
}: {
  aiMatchedCount: number;
  counts: FitScoreCount[] | undefined;
  isAiSearchActive: boolean;
}) {
  if (isAiSearchActive && aiMatchedCount > 0) {
    return aiMatchedCount;
  }

  if (!Array.isArray(counts)) {
    return 0;
  }

  return counts.reduce((total, item) => total + (item?.count || 0), 0);
}

export function getFitScoreGradeBorderColor(grade: string) {
  return GRADE_BORDER_COLORS[grade] || 'bg-primary';
}

export function getFitScoreGradeTextColor(grade: string) {
  return GRADE_TEXT_COLORS[grade] || 'text-primary';
}

export function toggleFitScoreGrade({
  filterMode,
  grade,
  onGradeToggle,
  selectedGrades,
}: {
  filterMode: 'single' | 'multi';
  grade: string;
  onGradeToggle: (grade: string) => void;
  selectedGrades: Set<string>;
}) {
  if (filterMode === 'single' && selectedGrades.size > 0) {
    selectedGrades.forEach((selectedGrade) => {
      if (selectedGrade !== grade) {
        onGradeToggle(selectedGrade);
      }
    });
  }

  onGradeToggle(grade);
}
