import type { BoardFieldOption } from './CustomizeBoardMultiSelect';

export interface BoardGroupingSectionProps {
  columnField: string;
  disabled: boolean;
  getAllPossibleValues: (fieldKey: string, fallbackFieldValues?: string[]) => string[];
  getFieldLabel: (key: string) => string;
  rowAndColumnFields: BoardFieldOption[];
  rowField: string;
  setColumnField: (field: string) => void;
  setRowField: (field: string) => void;
  setVisibleColumnValues: (values: string[]) => void;
  setVisibleRowValues: (values: string[]) => void;
  visibleColumnValues: string[];
  visibleRowValues: string[];
}

export interface CardFieldsSectionProps {
  cardFields: BoardFieldOption[];
  setVisibleFields: (fields: string[]) => void;
  visibleFields: string[];
}

export interface CustomizeBoardModalFooterProps {
  disabled: boolean;
  initializing: boolean;
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}
