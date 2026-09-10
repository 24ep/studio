export interface BoardApplicant {
  fitScore?: number;
  customAttributes?: Record<string, unknown>;
  parsedData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BoardRecruiter {
  id: string;
  name?: string;
}

export interface BoardPosition {
  id: string;
  title?: string;
}

export interface BoardStage {
  id: string;
  name: string;
}

export interface UserPreference {
  attributeKey: string;
  customNote?: string | null;
}

export interface PossibleBoardValueOptions {
  applicants: BoardApplicant[];
  cleanRowFieldValues: string[];
  fieldKey: string;
  positions: BoardPosition[];
  recruiters: BoardRecruiter[];
  stages: BoardStage[];
}

export interface CustomizeBoardPreferenceOptions {
  columnField: string;
  rowField: string;
  visibleColumnValues: string[];
  visibleFields: string[];
  visibleRowValues: string[];
}
