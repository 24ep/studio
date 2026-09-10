import { z } from "zod";

export const SURVEY_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "scheduled",
  "active",
  "paused",
  "closed",
  "archived",
  "cancelled",
] as const;

export const SURVEY_PRIVACY_MODES = ["identified", "confidential", "anonymous"] as const;

export const SURVEY_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "dropdown",
  "yes_no",
  "true_false",
  "short_text",
  "long_text",
  "numeric",
  "date",
  "time",
  "rating",
  "likert",
  "nps",
  "enps",
  "matrix",
  "ranking",
  "slider",
  "percentage",
  "file_upload",
  "image_choice",
  "information",
  "consent",
  "acknowledgment",
] as const;

export const surveyStatusSchema = z.enum(SURVEY_STATUSES);
export const surveyPrivacyModeSchema = z.enum(SURVEY_PRIVACY_MODES);
export const surveyQuestionTypeSchema = z.enum(SURVEY_QUESTION_TYPES);

export const logicConditionSchema = z.object({
  questionId: z.string().uuid(),
  operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than", "answered", "not_answered"]),
  value: z.unknown().optional(),
});

export const logicRuleSchema = z.object({
  id: z.string().uuid().optional(),
  conditions: z.array(logicConditionSchema).min(1),
  action: z.enum(["show", "hide", "skip_to_section", "end_survey", "require_explanation"]),
  targetQuestionId: z.string().uuid().optional(),
  targetSectionId: z.string().uuid().optional(),
});

export const questionConfigSchema = z.object({
  options: z.array(z.object({
    id: z.string(),
    label: z.string().trim().min(1).max(500),
    value: z.string(),
  })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  placeholder: z.string().max(500).optional(),
  randomizeOptions: z.boolean().optional(),
  scaleLabels: z.object({
    low: z.string().max(120),
    high: z.string().max(120),
  }).optional(),
}).passthrough();

export const surveyQuestionInputSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid(),
  type: surveyQuestionTypeSchema,
  text: z.string().trim().min(1).max(2_000),
  description: z.string().max(4_000).nullable().optional(),
  helpText: z.string().max(1_000).nullable().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  config: questionConfigSchema.default({}),
  logic: z.array(logicRuleSchema).default([]),
  dimension: z.string().trim().max(160).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

export const surveySectionInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(4_000).nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  conditions: z.array(logicConditionSchema).default([]),
  randomizeQuestions: z.boolean().default(false),
});

export const surveyCreateSchema = z.object({
  title: z.string().trim().min(2).max(300),
  internalName: z.string().trim().min(2).max(300).optional(),
  description: z.string().trim().max(4_000).nullable().optional(),
  introduction: z.string().trim().max(12_000).nullable().optional(),
  type: z.string().trim().min(1).max(100).default("custom"),
  privacyMode: surveyPrivacyModeSchema.default("identified"),
  departmentOwnerId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(240).default(5),
  language: z.string().trim().min(2).max(20).default("en"),
  additionalLanguages: z.array(z.string().trim().min(2).max(20)).max(20).default([]),
  completionMessage: z.string().trim().max(4_000).nullable().optional(),
  contactInformation: z.string().trim().max(500).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  isRequired: z.boolean().default(false),
  allowDraft: z.boolean().default(true),
  allowEditAfterSubmit: z.boolean().default(false),
  anonymousThreshold: z.number().int().min(3).max(100).default(5),
  resultsVisibility: z.enum(["owner_after_close", "owner_live", "respondents_after_close", "manual_release"]).default("owner_after_close"),
  opensAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  timezone: z.string().trim().min(1).max(80).default("Asia/Bangkok"),
  templateId: z.string().uuid().optional(),
});

export const surveyUpdateSchema = surveyCreateSchema.partial().extend({
  status: surveyStatusSchema.optional(),
  expectedVersion: z.number().int().positive(),
  sections: z.array(surveySectionInputSchema).optional(),
  questions: z.array(surveyQuestionInputSchema).optional(),
});

export const audienceRuleSchema = z.object({
  id: z.string().uuid().optional(),
  mode: z.enum(["include", "exclude"]),
  attribute: z.enum([
    "employee",
    "company",
    "business_unit",
    "department",
    "manager",
    "position",
    "location",
    "employment_type",
    "status",
    "join_date",
    "tenure_months",
    "client",
  ]),
  operator: z.enum(["equals", "not_equals", "in", "not_in", "before", "after", "between", "contains"]),
  value: z.unknown(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const audiencePreviewSchema = z.object({
  rules: z.array(audienceRuleSchema).max(100),
  snapshotMode: z.enum(["dynamic", "fixed"]).default("fixed"),
});

export const publishSurveySchema = z.object({
  confirmationPopulation: z.number().int().nonnegative(),
  channels: z.array(z.enum(["in_app", "employee_portal", "ess", "broadcast", "email"])).min(1),
  publishAt: z.string().datetime().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
});

export const answerValueSchema = z.union([
  z.string().max(20_000),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string().max(2_000), z.number(), z.boolean()])).max(500),
  z.record(z.string(), z.union([z.string().max(5_000), z.number(), z.boolean(), z.null()])),
  z.null(),
]);

export const responseSaveSchema = z.object({
  responseToken: z.string().min(24).max(500).optional(),
  invitationToken: z.string().min(24).max(500).optional(),
  expectedVersion: z.number().int().positive().optional(),
  answers: z.record(z.string().uuid(), answerValueSchema),
  submit: z.boolean().default(false),
});

export const surveyOperationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reminder"),
    name: z.string().trim().min(2).max(200),
    triggerType: z.enum(["manual", "scheduled", "before_close"]),
    channel: z.enum(["in_app", "employee_portal", "ess", "broadcast", "email"]),
    scheduledAt: z.string().datetime().nullable().optional(),
    targetStatuses: z.array(z.enum(["not_started", "in_progress"])).min(1),
  }),
  z.object({
    action: z.literal("action_plan"),
    title: z.string().trim().min(2).max(300),
    description: z.string().trim().max(4_000).nullable().optional(),
    ownerUserId: z.string().uuid(),
    dueAt: z.string().datetime().nullable().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    source: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    action: z.literal("result_release"),
    audience: z.enum(["owners", "managers", "respondents", "company"]),
    scope: z.record(z.string(), z.unknown()).default({}),
    releaseNow: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("lifecycle"),
    status: surveyStatusSchema,
  }),
]);

export const surveyDefinitionImportSchema = z.object({
  mode: z.enum(["replace", "append"]).default("replace"),
  expectedVersion: z.number().int().positive(),
  definition: z.object({
    title: z.string().trim().min(2).max(300).optional(),
    description: z.string().max(4_000).nullable().optional(),
    introduction: z.string().max(12_000).nullable().optional(),
    sections: z.array(surveySectionInputSchema).max(200),
    questions: z.array(surveyQuestionInputSchema).max(2_000),
  }),
});

export type AudienceRuleInput = z.infer<typeof audienceRuleSchema>;
export type SurveyCreateInput = z.infer<typeof surveyCreateSchema>;
export type SurveyPrivacyMode = z.infer<typeof surveyPrivacyModeSchema>;
export type SurveyQuestionInput = z.infer<typeof surveyQuestionInputSchema>;
export type SurveySectionInput = z.infer<typeof surveySectionInputSchema>;
