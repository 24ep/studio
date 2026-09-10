import * as z from 'zod';

export const addPositionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  divisionId: z.string().uuid("Division is required"),
  departmentId: z.string().uuid("Department is required"),
  sectionId: z.string().uuid("Section is required"),
  unitId: z.string().uuid("Unit is required"),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  positionLevel: z.string().optional().nullable(),
  reportsTo: z.string().optional().nullable(),
  costCenter: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  jobFamily: z.string().optional().nullable(),
  gradeId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  onboardingClientId: z.string().uuid().optional().nullable(),
  onboardingAssetTypes: z.array(z.string()).default([]),
});

export type AddPositionFormValues = z.infer<typeof addPositionFormSchema>;

export const ADD_POSITION_DEFAULT_VALUES: AddPositionFormValues = {
  title: '',
  department: '',
  divisionId: '',
  departmentId: '',
  sectionId: '',
  unitId: '',
  description: '',
  matchCriteria: '',
  isOpen: true,
  positionLevel: '',
  reportsTo: '',
  costCenter: '',
  budget: '',
  employmentType: 'Full-time',
  jobFamily: '',
  gradeId: null,
  recruiterId: null,
  onboardingClientId: null,
  onboardingAssetTypes: [],
};
