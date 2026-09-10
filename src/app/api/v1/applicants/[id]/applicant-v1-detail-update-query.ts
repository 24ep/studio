import { type UpdateApplicantInput } from './applicant-v1-detail-schema';

export function buildApplicantUpdateQuery(
  updateData: UpdateApplicantInput,
  existingParsedData: Record<string, unknown> | null | undefined,
  id: string
) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  let paramIndex = 1;

  const pushField = (field: string, value: unknown) => {
    updateFields.push(`${field} = $${paramIndex++}`);
    updateValues.push(value);
  };

  if (updateData.name !== undefined) pushField('name', updateData.name);
  if (updateData.email !== undefined) pushField('email', updateData.email);
  if (updateData.phone !== undefined) pushField('phone', updateData.phone);
  if (updateData.positionId !== undefined) pushField('"positionId"', updateData.positionId);
  if (updateData.recruiterId !== undefined) pushField('"recruiterId"', updateData.recruiterId);

  let fitScoreToUpdate: number | undefined;
  if (typeof updateData.fitScore === 'number') {
    fitScoreToUpdate = updateData.fitScore;
  } else if (updateData.job_applied && typeof updateData.job_applied.fitScore === 'number') {
    fitScoreToUpdate = updateData.job_applied.fitScore;
  }
  if (typeof fitScoreToUpdate === 'number') {
    pushField('"fitScore"', fitScoreToUpdate);
  }

  if (updateData.status !== undefined) pushField('"statusId"', updateData.status);
  if (updateData.custom_attributes !== undefined) pushField('"customAttributes"', updateData.custom_attributes);
  if (updateData.resumePath !== undefined) pushField('"resumePath"', updateData.resumePath);
  if (updateData.avatarUrl !== undefined) pushField('"avatarUrl"', updateData.avatarUrl);
  if (updateData.sourceId !== undefined) pushField('"sourceId"', updateData.sourceId);
  if (updateData.subSource !== undefined) pushField('"subSource"', updateData.subSource);

  let newParsedData: Record<string, unknown> = { ...(existingParsedData ?? {}) };
  let hasParsedDataChanges = false;

  if (updateData.applicant_info) {
    newParsedData.applicant_info = {
      ...(newParsedData.applicant_info || {}),
      ...updateData.applicant_info,
    };
    hasParsedDataChanges = true;
  }

  if (updateData.job_matches) {
    newParsedData.job_matches = updateData.job_matches;
    hasParsedDataChanges = true;
  }

  if (updateData.job_applied) {
    newParsedData.job_applied = updateData.job_applied;
    hasParsedDataChanges = true;
    if (updateData.job_applied.fitScore !== undefined) {
      pushField('"fitScore"', updateData.job_applied.fitScore);
    }
    if (updateData.job_applied.justification !== undefined) {
      pushField(
        '"assignmentJustification"',
        Array.isArray(updateData.job_applied.justification)
          ? updateData.job_applied.justification.join('\n')
          : updateData.job_applied.justification
      );
    }
  }

  if (updateData.parsedData) {
    newParsedData = { ...newParsedData, ...updateData.parsedData };
    hasParsedDataChanges = true;
  }

  if (hasParsedDataChanges) {
    pushField('"parsedData"', newParsedData);
  }

  if (updateFields.length === 0) {
    return null;
  }

  updateValues.push(id);

  return {
    query: `
      UPDATE "Applicant"
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `,
    values: updateValues,
  };
}
