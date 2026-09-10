import { z } from 'zod';
import { verifyApiToken, type VerifiedApiToken } from '@/lib/auth';

export const updatePositionSchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean().optional(),
  positionLevel: z.string().optional().nullable(),
  custom_attributes: z.record(z.unknown()).optional().nullable(),
});

export type UpdatePositionData = z.infer<typeof updatePositionSchema>;

type PositionResponseRow = {
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  customAttributes?: Record<string, unknown> | null;
};

type PositionUpdateField = Exclude<keyof UpdatePositionData, 'custom_attributes'>;

const POSITION_SELECT_QUERY = `
  SELECT p.id, p.title, p.department, p.description, p."matchCriteria", p."isOpen",
    p."positionLevel", p."gradeId", p."recruiterId", p."customAttributes",
    p."createdAt", p."updatedAt", u.name as "recruiterName", u.email as "recruiterEmail"
  FROM "Position" p
  LEFT JOIN "User" u ON p."recruiterId" = u.id
  WHERE p.id = $1
`;

const POSITION_UPDATE_COLUMNS: Array<{ key: PositionUpdateField; column: string }> = [
  { key: 'title', column: 'title' },
  { key: 'department', column: 'department' },
  { key: 'description', column: 'description' },
  { key: 'matchCriteria', column: '"matchCriteria"' },
  { key: 'isOpen', column: '"isOpen"' },
  { key: 'positionLevel', column: '"positionLevel"' },
];

export const POSITION_DETAIL_QUERY = POSITION_SELECT_QUERY;

export function getBearerToken(request: Request) {
  return request.headers.get('authorization')?.split(' ')[1] ?? null;
}

export async function verifyBearerApiUser(request: Request) {
  const token = getBearerToken(request);
  return token ? verifyApiToken(token) : null;
}

export function hasPositionUpdatePermission(user: VerifiedApiToken) {
  return user.role === 'Admin' || user.modulePermissions?.includes('POSITIONS_EDIT_DETAILED');
}

export function hasPositionDeletePermission(user: VerifiedApiToken) {
  return user.role === 'Admin' || user.modulePermissions?.includes('POSITIONS_DELETE');
}

export function getActingUserName(user: Pick<VerifiedApiToken, 'id' | 'name' | 'email'> | null) {
  return user?.name || user?.email || user?.id || 'System';
}

export function formatZodFieldErrors(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
    .join('; ');
}

export function toAuditPayload(body: unknown): Record<string, unknown> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }

  return body === undefined ? {} : { requestBody: body };
}

export function serializePositionRow<T extends PositionResponseRow>(position: T) {
  return {
    ...position,
    custom_attributes: position.customAttributes || {},
    recruiter: position.recruiterId
      ? {
          id: position.recruiterId,
          name: position.recruiterName,
          email: position.recruiterEmail,
        }
      : null,
  };
}

export function serializeUpdatedPositionRow<T extends PositionResponseRow>(position: T) {
  return {
    ...position,
    custom_attributes: position.customAttributes || {},
  };
}

export function buildPositionUpdateQuery(updateData: UpdatePositionData, id: string) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  for (const { key, column } of POSITION_UPDATE_COLUMNS) {
    if (updateData[key] !== undefined) {
      updateFields.push(`${column} = $${paramIndex++}`);
      updateValues.push(updateData[key]);
    }
  }

  if (updateData.custom_attributes !== undefined) {
    updateFields.push(`"customAttributes" = $${paramIndex++}`);
    updateValues.push(updateData.custom_attributes);
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateFields.push('"updatedAt" = NOW()');
  updateValues.push(id);

  return {
    text: `
      UPDATE "Position"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `,
    values: updateValues,
  };
}
