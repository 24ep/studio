import { z } from 'zod';

export const updateTransitionSchema = z.object({
  notes: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});

export type TransitionUpdateInput = z.infer<typeof updateTransitionSchema>;

export function extractTransitionIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/\/transitions\/([^/]+)/);
  return match ? match[1] : null;
}

export function getTransitionRouteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getTransitionActorLabel(user: { name?: string | null; email?: string | null } | null | undefined) {
  return user?.name || user?.email || 'Unknown';
}

export function buildTransitionUpdateQuery(input: TransitionUpdateInput, id: string) {
  const updateFields = ['notes = $1', '"updatedAt" = NOW()'];
  const updateValues: unknown[] = [input.notes];
  let paramIndex = 2;

  if (input.date) {
    updateFields.push(`date = $${paramIndex}`);
    updateValues.push(input.date);
    paramIndex++;
  }

  updateValues.push(id);

  return {
    query: `UPDATE "TransitionRecord" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values: updateValues,
  };
}
