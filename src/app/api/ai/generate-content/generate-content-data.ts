import { getPool } from '@/lib/db';

const APPLICANT_QUERY = `
  SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c."statusId",
    c."applicationDate",
    c."fitScore",
    c."dataAiHint",
    c."customAttributes",
    c."parsedData",
    c."assignmentJustification",
    c."educationData",
    c."experienceData",
    c."resumePath",
    c."avatarUrl",
    c."createdAt",
    c."updatedAt",
    p.id as "positionId",
    p.title as "positionTitle",
    p.department as "positionDepartment",
    p.description as "positionDescription",
    p."positionLevel" as "positionLevel",
    p."isOpen" as "positionIsOpen",
    p."customAttributes" as "positionCustomAttributes",
    u.name as "recruiterName",
    u.email as "recruiterEmail",
    rs.name as "currentStage",
    rs.description as "stageDescription",
    rs.color_badge as "stageColor"
  FROM "Applicant" c
  LEFT JOIN "Position" p ON c."positionId" = p.id
  LEFT JOIN "User" u ON c."recruiterId" = u.id
  LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
  WHERE c.id = $1
`;

const APPLICANT_COMMENTS_QUERY = `
  SELECT
    cc.content,
    cc."createdAt",
    u.name as "createdBy"
  FROM "ApplicantComment" cc
  LEFT JOIN "User" u ON cc."authorId" = u.id
  WHERE cc."applicantId" = $1
  ORDER BY cc."createdAt" DESC
  LIMIT 10
`;

const TRANSITION_RECORDS_QUERY = `
  SELECT
    tr.stage,
    tr.date,
    tr.notes,
    tr."actingUserId",
    u.name as "actingUserName"
  FROM "TransitionRecord" tr
  LEFT JOIN "User" u ON tr."actingUserId" = u.id
  WHERE tr."applicant_id" = $1
  ORDER BY tr.date DESC
  LIMIT 10
`;

const ATTACHMENTS_QUERY = `
  SELECT
    a."fileName",
    a."filePath",
    a.label,
    a."isPrimary",
    a."uploadedAt",
    u.name as "uploadedByName"
  FROM "Attachment" a
  LEFT JOIN "User" u ON a."uploadedById" = u.id
  WHERE a."applicantId" = $1
  ORDER BY a."uploadedAt" DESC
`;

const JOB_MATCHES_QUERY = `
  SELECT
    jm."fitScore",
    jm."matchReasons",
    jm."createdAt",
    jm."job_description_summary",
    jm."jobId",
    jm."jobTitle",
    p.title as "positionTitle",
    p.department as "positionDepartment",
    p.description as "positionDescription",
    p."positionLevel" as "positionLevel",
    p."isOpen" as "positionIsOpen",
    p."customAttributes" as "positionCustomAttributes",
    p."matchCriteria" as "positionMatchCriteria",
    p."createdAt" as "positionCreatedAt",
    p."updatedAt" as "positionUpdatedAt"
  FROM "JobMatch" jm
  LEFT JOIN "Position" p ON jm."jobId" = p.id
  WHERE jm."applicant_id" = $1
  ORDER BY jm."fitScore" DESC, jm."createdAt" DESC
  LIMIT 10
`;

const APPLIED_POSITION_QUERY = `
  SELECT
    p.id,
    p.title,
    p.department,
    p.description,
    p."positionLevel",
    p."isOpen",
    p."customAttributes",
    p."matchCriteria",
    p."createdAt",
    p."updatedAt"
  FROM "Position" p
  WHERE p.id = $1
`;

export async function getGenerateContentApplicantData(applicantId: string) {
  const client = await getPool().connect();

  try {
    const applicantResult = await client.query(APPLICANT_QUERY, [applicantId]);
    if (applicantResult.rows.length === 0) {
      throw new Error('Applicant not found');
    }

    const applicant = applicantResult.rows[0];
    const commentsResult = await client.query(APPLICANT_COMMENTS_QUERY, [applicantId]);
    const transitionsResult = await client.query(TRANSITION_RECORDS_QUERY, [applicantId]);
    const attachmentsResult = await client.query(ATTACHMENTS_QUERY, [applicantId]);
    const matchesResult = await client.query(JOB_MATCHES_QUERY, [applicantId]);

    let appliedPositionData = null;
    if (applicant.positionId) {
      const appliedPositionResult = await client.query(APPLIED_POSITION_QUERY, [applicant.positionId]);
      appliedPositionData = appliedPositionResult.rows[0] || null;
    }

    return {
      applicant,
      comments: commentsResult.rows,
      transitions: transitionsResult.rows,
      resumes: [],
      attachments: attachmentsResult.rows,
      applicantComments: commentsResult.rows,
      transitionRecords: transitionsResult.rows,
      jobMatches: matchesResult.rows,
      appliedPositionData,
    };
  } finally {
    client.release();
  }
}
