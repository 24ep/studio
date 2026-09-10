export const INSERT_APPLICANT_QUERY = `
  INSERT INTO "Applicant" (id, name, email, phone, "positionId", "fitScore", "statusId", "parsedData", "customAttributes", "applicationDate", "sourceId", "subSource", "assignmentJustification", "avatarUrl", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
  RETURNING *;
`;

export const INSERT_INITIAL_APPLICANT_TRANSITION_QUERY = `
  INSERT INTO "TransitionRecord" (id, "applicant_id", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW());
`;

export const APPLICANT_WITH_RECRUITER_QUERY = `
  SELECT c.*, p.title as "positionTitle", u.id as "recruiterId", u.name as "recruiterName"
  FROM "Applicant" c
  LEFT JOIN "Position" p ON c."positionId" = p.id
  LEFT JOIN "User" u ON c."recruiterId" = u.id
  WHERE c.id = $1
`;
