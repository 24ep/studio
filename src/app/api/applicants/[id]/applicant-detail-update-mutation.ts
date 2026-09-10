export interface ApplicantUpdatePayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  expectedSalary?: unknown;
  positionId?: unknown;
  recruiterId?: unknown;
  fitScore?: unknown;
  status?: unknown;
  assignmentJustification?: unknown;
  parsedData?: unknown;
  custom_attributes?: unknown;
  customFields?: unknown;
  resumePath?: unknown;
  avatarUrl?: unknown;
  sourceId?: unknown;
  subSource?: unknown;
  isPinned?: unknown;
  isBlacklisted?: unknown;
}

export interface ApplicantUpdateMutation {
  query: string;
  values: unknown[];
  fields: string[];
}

function appendField(fields: string[], values: unknown[], column: string, value: unknown) {
  fields.push(`${column} = $${values.length + 1}`);
  values.push(value);
}

export function buildApplicantUpdateMutation(payload: ApplicantUpdatePayload, applicantId: string): ApplicantUpdateMutation {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (payload.name !== undefined) appendField(fields, values, 'name', payload.name);
  if (payload.email !== undefined) appendField(fields, values, 'email', payload.email);
  if (payload.phone !== undefined) appendField(fields, values, 'phone', payload.phone);
  if (payload.expectedSalary !== undefined) appendField(fields, values, 'expected_salary', payload.expectedSalary);
  if (payload.positionId !== undefined) appendField(fields, values, '"positionId"', payload.positionId);
  if (payload.recruiterId !== undefined) appendField(fields, values, '"recruiterId"', payload.recruiterId);
  if (payload.fitScore !== undefined) appendField(fields, values, '"fitScore"', payload.fitScore);
  if (payload.status !== undefined) appendField(fields, values, '"statusId"', payload.status);

  if (payload.assignmentJustification !== undefined) {
    appendField(
      fields,
      values,
      '"assignmentJustification"',
      Array.isArray(payload.assignmentJustification)
        ? payload.assignmentJustification.join('\n')
        : payload.assignmentJustification
    );
  }

  if (payload.parsedData !== undefined) appendField(fields, values, '"parsedData"', payload.parsedData);

  const customAttributesToSave = payload.customFields !== undefined
    ? payload.customFields
    : payload.custom_attributes;
  if (customAttributesToSave !== undefined) {
    appendField(fields, values, '"customAttributes"', customAttributesToSave);
  }

  if (payload.resumePath !== undefined) appendField(fields, values, '"resumePath"', payload.resumePath);
  if (payload.avatarUrl !== undefined) appendField(fields, values, '"avatarUrl"', payload.avatarUrl);
  if (payload.sourceId !== undefined) appendField(fields, values, '"sourceId"', payload.sourceId);
  if (payload.subSource !== undefined) appendField(fields, values, '"subSource"', payload.subSource);

  if (typeof payload.isPinned === 'boolean') {
    appendField(fields, values, '"isPinned"', payload.isPinned);
    fields.push(payload.isPinned ? '"pinnedAt" = NOW()' : '"pinnedAt" = NULL');
  }

  if (typeof payload.isBlacklisted === 'boolean') {
    appendField(fields, values, '"isBlacklisted"', payload.isBlacklisted);
  }

  fields.push('"updatedAt" = NOW()');
  values.push(applicantId);

  return {
    fields,
    values,
    query: `
      UPDATE "Applicant" 
      SET ${fields.join(', ')}
      WHERE id = $${values.length}::uuid
      RETURNING *;
    `,
  };
}
