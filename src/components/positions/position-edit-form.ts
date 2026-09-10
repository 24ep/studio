import * as z from 'zod';

export const editPositionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  positionLevel: z.string().optional().nullable(),
  probationPeriodDays: z.coerce.number().int().min(1).max(730),
  probationEvaluationFrequencyDays: z.coerce.number().int().min(1).max(365),
  gradeId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  onboardingClientId: z.string().uuid().optional().nullable(),
  onboardingAssetTypes: z.array(z.string()).default([]),
  location: z.string().default(''),
  employmentType: z.string().default(''),
  workModel: z.string().default(''),
  salaryRange: z.string().default(''),
  targetStartDate: z.string().default(''),
  hiringManagerName: z.string().default(''),
  successOutcomes: z.array(z.string()).default([]),
  coreResponsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  matchCriteriaPreview: z.array(z.string()).default([]),
});

export type EditPositionFormValues = z.infer<typeof editPositionFormSchema>;
