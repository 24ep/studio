export type SurveySection = { id: string; title: string; description?: string | null; sortOrder: number; conditions: unknown[]; randomizeQuestions: boolean };
export type SurveyQuestion = { id: string; sectionId: string; type: string; text: string; description?: string | null; helpText?: string | null; isRequired: boolean; sortOrder: number; config: { options?: Array<{ id: string; label: string; value: string }>; min?: number; max?: number; placeholder?: string; scaleLabels?: { low: string; high: string }; [key: string]: unknown }; logic: unknown[]; dimension?: string | null; tags: string[] };
export type SurveyDetail = {
  id: string; title: string; internalName: string; description?: string | null; introduction?: string | null; type: string; status: string; privacyMode: string;
  ownerUserId: string; estimatedMinutes: number; language: string; additionalLanguages: string[]; completionMessage?: string | null; contactInformation?: string | null;
  tags: string[]; isRequired: boolean; allowDraft: boolean; allowEditAfterSubmit: boolean; anonymousThreshold: number; resultsVisibility: string;
  opensAt?: string | null; closesAt?: string | null; timezone: string; version: number; updatedAt: string;
  sections: SurveySection[]; questions: SurveyQuestion[]; audienceRules: AudienceRule[];
  participation: { invitations: number; completed: number; inProgress: number; notStarted: number };
};
export type AudienceRule = { id?: string; mode: "include" | "exclude"; attribute: string; operator: string; value: unknown; sortOrder: number };
export type SurveyAnalytics = { survey: { id: string; title: string; privacyMode: string; anonymousThreshold: number }; participation: { invited: number; completed: number; inProgress: number; notStarted: number; responseRate: number | null }; departmentBreakdown: Array<{ department: string; invited: number; completed: number; responseRate: number | null; suppressed: boolean }>; questionResults: Array<{ questionId: string; text: string; type: string; responseCount: number; suppressed: boolean; suppressionReason?: string; distribution?: Array<{ label: string; value: number }>; average?: number | null; dimension?: string | null }> };
export type SurveyOperations = { versions: Record<string, unknown>[]; reminders: Record<string, unknown>[]; releases: Record<string, unknown>[]; actionPlans: Record<string, unknown>[]; distributions: Record<string, unknown>[]; audit: Record<string, unknown>[]; responses: Record<string, unknown>[] };

export const QUESTION_TYPES = [
  ["single_choice", "Single choice"], ["multiple_choice", "Multiple choice"], ["dropdown", "Dropdown"], ["yes_no", "Yes / No"],
  ["short_text", "Short text"], ["long_text", "Long text"], ["numeric", "Number"], ["date", "Date"], ["time", "Time"],
  ["rating", "Rating"], ["likert", "Likert scale"], ["nps", "NPS"], ["enps", "eNPS"], ["matrix", "Matrix"], ["ranking", "Ranking"],
  ["slider", "Slider"], ["percentage", "Percentage"], ["file_upload", "File upload"], ["image_choice", "Image choice"],
  ["information", "Information"], ["consent", "Consent"], ["acknowledgment", "Acknowledgment"],
] as const;
