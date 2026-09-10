import type { UpdateApplicantSourceInput } from './applicant-source-detail-schema';

type UpdateFieldDefinition = {
  key: keyof UpdateApplicantSourceInput;
  column: string;
};

const UPDATE_FIELD_DEFINITIONS: UpdateFieldDefinition[] = [
  { key: 'name', column: 'name' },
  { key: 'description', column: 'description' },
  { key: 'email', column: 'email' },
  { key: 'logo', column: 'logo' },
  { key: 'allowSubSource', column: 'allow_sub_source' },
  { key: 'sortOrder', column: 'sort_order' },
  { key: 'isActive', column: 'is_active' },
];

export function buildApplicantSourceUpdateQuery(input: UpdateApplicantSourceInput, id: string) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  for (const field of UPDATE_FIELD_DEFINITIONS) {
    if (input[field.key] !== undefined) {
      updateFields.push(`${field.column} = $${paramIndex++}`);
      updateValues.push(input[field.key]);
    }
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateFields.push('"updatedAt" = NOW()');
  updateValues.push(id);

  return {
    sql: `
      UPDATE "ApplicantSource"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, email, logo, allow_sub_source as "allowSubSource",
                sort_order as "sortOrder", is_active as "isActive",
                "createdAt", "updatedAt"
    `,
    values: updateValues,
  };
}
