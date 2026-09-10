import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toggleApplicantGradeSelection } from '../applicant-page-utils';

interface UseApplicantHorizontalFitScoreFiltersInput {
  setPage: Dispatch<SetStateAction<number>>;
  setHorizontalSelectedFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
  setHorizontalSelectedMatchingFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
}

export function useApplicantHorizontalFitScoreFilters({
  setPage,
  setHorizontalSelectedFitScoreGrades,
  setHorizontalSelectedMatchingFitScoreGrades,
}: UseApplicantHorizontalFitScoreFiltersInput) {
  const handleHorizontalFitScoreGradeToggle = useCallback((grade: string) => {
    setHorizontalSelectedFitScoreGrades(prev => toggleApplicantGradeSelection(prev, grade));
    setPage(1);
  }, [setHorizontalSelectedFitScoreGrades, setPage]);

  const handleHorizontalMatchingFitScoreGradeToggle = useCallback((grade: string) => {
    setHorizontalSelectedMatchingFitScoreGrades(prev => toggleApplicantGradeSelection(prev, grade));
    setPage(1);
  }, [setHorizontalSelectedMatchingFitScoreGrades, setPage]);

  const clearAllHorizontalFitScoreFilters = useCallback(() => {
    setHorizontalSelectedFitScoreGrades(new Set());
    setHorizontalSelectedMatchingFitScoreGrades(new Set());
    setPage(1);
  }, [
    setHorizontalSelectedFitScoreGrades,
    setHorizontalSelectedMatchingFitScoreGrades,
    setPage,
  ]);

  return {
    handleHorizontalFitScoreGradeToggle,
    handleHorizontalMatchingFitScoreGradeToggle,
    clearAllHorizontalFitScoreFilters,
  };
}
