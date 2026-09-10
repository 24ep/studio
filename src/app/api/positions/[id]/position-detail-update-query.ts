import { sanitizeHtml, sanitizeRichHtml } from '@/lib/security';
import { type UpdatePositionInput } from './position-detail-schema';

export function buildPositionUpdateQuery(updateData: UpdatePositionInput, id: string) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  if (updateData.title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(sanitizeHtml(updateData.title || ''));
  }
  if (updateData.department !== undefined) {
    updateFields.push(`department = $${paramIndex++}`);
    updateValues.push(updateData.department);
  }
  if (updateData.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(updateData.description ? sanitizeRichHtml(updateData.description) : null);
  }
  if (updateData.matchCriteria !== undefined) {
    updateFields.push(`"matchCriteria" = $${paramIndex++}`);
    updateValues.push(updateData.matchCriteria ? sanitizeRichHtml(updateData.matchCriteria) : null);
  }
  if (updateData.isOpen !== undefined) {
    updateFields.push(`"isOpen" = $${paramIndex++}`);
    updateValues.push(updateData.isOpen);
  }
  if (updateData.positionLevel !== undefined) {
    updateFields.push(`"positionLevel" = $${paramIndex++}`);
    updateValues.push(updateData.positionLevel);
  }
  if (updateData.positionAttribute !== undefined) {
    updateFields.push(`"positionAttribute" = $${paramIndex++}`);
    updateValues.push(updateData.positionAttribute);
  }
  if (updateData.probationPeriodDays !== undefined) {
    updateFields.push(`"probation_period_days" = $${paramIndex++}`);
    updateValues.push(updateData.probationPeriodDays);
  }
  if (updateData.probationEvaluationFrequencyDays !== undefined) {
    updateFields.push(`"probation_evaluation_frequency_days" = $${paramIndex++}`);
    updateValues.push(updateData.probationEvaluationFrequencyDays);
  }
  if (updateData.gradeId !== undefined) {
    updateFields.push(`"gradeId" = $${paramIndex++}`);
    updateValues.push(updateData.gradeId);
  }
  if (updateData.recruiterId !== undefined) {
    updateFields.push(`"recruiterId" = $${paramIndex++}`);
    updateValues.push(updateData.recruiterId);
  }
  if (updateData.organizationUnitId !== undefined) {
    updateFields.push(`"organization_unit_id" = $${paramIndex++}`);
    updateValues.push(updateData.organizationUnitId);
  }
  if (updateData.custom_attributes !== undefined) {
    updateFields.push(`"customAttributes" = $${paramIndex++}`);
    updateValues.push(updateData.custom_attributes);
  }

  updateFields.push('"updatedAt" = NOW()');

  if (updateFields.length === 1) {
    return null;
  }

  updateValues.push(id);

  return {
    query: `
      UPDATE "Position"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `,
    values: updateValues,
  };
}
