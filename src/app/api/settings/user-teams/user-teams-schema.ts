import { z } from 'zod';

const teamAssignmentConditionValues = z.array(z.string().trim().min(1)).transform((values) =>
  values.map((value) => value.trim())
);

const teamAssignmentConditionsSchema = z.object({
  department: teamAssignmentConditionValues.optional().default([]),
  officeLocation: teamAssignmentConditionValues.optional().default([]),
  positionTitle: teamAssignmentConditionValues.optional().default([]),
  employeeType: teamAssignmentConditionValues.optional().default([]),
  companyName: teamAssignmentConditionValues.optional().default([]),
  manager: teamAssignmentConditionValues.optional().default([]),
});

export const userTeamSchema = z.object({
  name: z.string().min(1, 'Team name cannot be empty.'),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  assignmentMode: z.enum(['manual', 'automatic']).optional().default('manual'),
  assignmentConditions: teamAssignmentConditionsSchema.optional().default({}),
}).refine(
  (team) => {
    if (team.assignmentMode !== 'automatic') {
      return true;
    }

    const { assignmentConditions } = team;
    return (
      (assignmentConditions.department?.length || 0) > 0
      || (assignmentConditions.officeLocation?.length || 0) > 0
      || (assignmentConditions.positionTitle?.length || 0) > 0
      || (assignmentConditions.employeeType?.length || 0) > 0
      || (assignmentConditions.companyName?.length || 0) > 0
      || (assignmentConditions.manager?.length || 0) > 0
    );
  },
  {
    message: 'Add at least one condition for automatic assignment mode.',
    path: ['assignmentConditions'],
  }
);

export type UserTeamInput = z.infer<typeof userTeamSchema>;
