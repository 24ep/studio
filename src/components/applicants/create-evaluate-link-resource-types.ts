export interface PositionValidationState {
  hasInterviewers: boolean;
  hasSkills: boolean;
  isLoading: boolean;
  error: string | null;
}

export const defaultPositionValidation: PositionValidationState = {
  hasInterviewers: false,
  hasSkills: false,
  isLoading: false,
  error: null,
};
