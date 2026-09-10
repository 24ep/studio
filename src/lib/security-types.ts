export type SanitizedApiInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizedApiInput[]
  | { [key: string]: SanitizedApiInput };

export type SessionSecurityInput = {
  user?: {
    id?: unknown;
  } | null;
  expires?: string | number | Date | null;
} | null | undefined;

export interface SecurityValidationResult {
  valid: boolean;
  errors: string[];
}
