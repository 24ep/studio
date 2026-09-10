export type ValidationType = 'error' | 'warning' | 'info';

export interface ValidationError {
  field: string;
  message: string;
  type?: ValidationType;
}

export type ValidationGroups = Record<ValidationType, ValidationError[]>;

export type ValidationSchema<T extends Record<string, unknown>> = {
  [Field in keyof T]: (value: T[Field]) => string | undefined;
};
