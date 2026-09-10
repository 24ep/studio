import * as z from 'zod';

export const editApplicantDetailSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  positionId: z.string().nullable().optional(),
  recruiterId: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional(),
  fitScore: z.number().nullable().optional(),
  status: z.string().optional(),
  expectedSalary: z.unknown().optional(),
  assignmentJustification: z.array(z.string()).optional(),
  parsedData: z.object({
    personal_info: z.object({
      title_honorific: z.string().optional(),
      firstname: z.string().optional(),
      lastname: z.string().optional(),
      nickname: z.string().optional(),
      location: z.string().optional(),
      introduction_aboutme: z.string().optional(),
    }).optional(),
    contact_info: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
    education: z.array(z.object({
      university: z.string().optional(),
      major: z.string().nullable().optional(),
      field: z.string().nullable().optional(),
      campus: z.string().nullable().optional(),
      startMonth: z.union([z.string(), z.number()]).nullable().optional(),
      startYear: z.union([z.string(), z.number()]).nullable().optional(),
      endMonth: z.union([z.string(), z.number()]).nullable().optional(),
      endYear: z.union([z.string(), z.number()]).nullable().optional(),
      isCurrent: z.boolean().optional(),
      GPA: z.string().nullable().optional(),
    }).passthrough()).optional(),
    experience: z.array(z.object({
      company: z.string().optional(),
      companyReferenceId: z.string().uuid().optional(),
      position: z.string().optional(),
      description: z.string().nullable().optional(),
      startMonth: z.union([z.string(), z.number()]).nullable().optional(),
      startYear: z.union([z.string(), z.number()]).nullable().optional(),
      endMonth: z.union([z.string(), z.number()]).nullable().optional(),
      endYear: z.union([z.string(), z.number()]).nullable().optional(),
      isCurrent: z.boolean().optional(),
      positionLevel: z.string().nullable().optional(),
    }).passthrough()).optional(),
    skills: z.array(z.object({
      segment_skill: z.string().optional(),
      skill_string: z.string().optional(),
    }).passthrough()).optional(),
    job_suitable: z.array(z.record(z.unknown())).optional(),
    job_matches: z.array(z.record(z.unknown())).optional(),
  }).optional(),
});

export type EditApplicantFormValues = z.infer<typeof editApplicantDetailSchema>;
type EditApplicantParsedData = NonNullable<EditApplicantFormValues['parsedData']>;

export type EditEducationEntry = NonNullable<EditApplicantParsedData['education']>[number];
export type EditExperienceEntry = NonNullable<EditApplicantParsedData['experience']>[number];
export type EditSkillEntry = NonNullable<EditApplicantParsedData['skills']>[number];
export type EditJobSuitableEntry = NonNullable<EditApplicantParsedData['job_suitable']>[number];
export type EditJobMatchEntry = NonNullable<EditApplicantParsedData['job_matches']>[number];
