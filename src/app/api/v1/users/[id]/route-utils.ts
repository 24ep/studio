import { z } from 'zod';
import { verifyApiToken, type VerifiedApiToken } from '@/lib/auth';

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['Admin', 'Recruiter', 'User']).optional(),
  password: z.string().min(6).optional(),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

const USER_UPDATE_COLUMNS: Array<{ key: keyof UpdateUserData; column: string }> = [
  { key: 'name', column: 'name' },
  { key: 'email', column: 'email' },
  { key: 'role', column: 'role' },
  { key: 'password', column: 'password' },
];

export function hasUserViewPermission(user: VerifiedApiToken) {
  return user.role === 'Admin' || user.modulePermissions?.includes('USERS_VIEW');
}

export function hasUserEditPermission(user: VerifiedApiToken) {
  return user.role === 'Admin' || user.modulePermissions?.includes('USERS_EDIT');
}

export function hasUserDeletePermission(user: VerifiedApiToken) {
  return user.role === 'Admin' || user.modulePermissions?.includes('USERS_DELETE');
}

export async function verifyBearerApiUser(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  return token ? verifyApiToken(token) : null;
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

export function buildUserUpdateQuery(updateData: UpdateUserData, id: string) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  for (const { key, column } of USER_UPDATE_COLUMNS) {
    if (updateData[key] !== undefined) {
      updateFields.push(`${column} = $${paramIndex++}`);
      updateValues.push(updateData[key]);
    }
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateValues.push(id);

  return {
    text: `
      UPDATE "User"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, "createdAt", "updatedAt";
    `,
    values: updateValues,
  };
}
