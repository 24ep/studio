export type ScreeningSubjectType = 'applicant' | 'employee';
export type ScreeningTrigger = 'manual' | 'applicant_created' | 'import' | 'public_apply' | 'automation';

export interface ScreeningIdentity {
  name: string;
  aliases: string[];
  employers: string[];
  jobTitle: string | null;
  location: string | null;
  education: string[];
  country: string | null;
}

export interface ScreeningSourceResult {
  sourceType: string;
  url: string;
  title: string;
  publisher?: string;
  publishedAt?: string;
  snippet?: string;
}

export interface ScreeningSettings {
  enabled: boolean;
  autoApplicantEnabled: boolean;
  aiAllowed: boolean;
  manualAiDefault: boolean;
  automaticAiDefault: boolean;
  enabledSources: string[];
  maxQueries: number;
  maxResultsPerQuery: number;
  monthlyQueryLimit: number;
  retentionDays: number;
  identityThreshold: number;
  braveConfigured: boolean;
}
