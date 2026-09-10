export const APPLICANT_DETAIL_QUERY = `
  SELECT 
    c.id,
    COALESCE(NULLIF(concat_ws(' ', person_profile.first_name, person_profile.last_name), ''), c.name) AS name,
    COALESCE(person_profile.email, c.email) AS email,
    COALESCE(person_profile.phone, c.phone) AS phone,
    c.person_profile_id AS "personProfileId",
    c."statusId",
    rs.name as "status",
    c."positionId",
    c."companyId",
    c."recruiterId",
    c."sourceId",
    c."fitScore",
    COALESCE(person_profile.avatar_url, c."avatarUrl") AS "avatarUrl",
    c."resumePath",
    c."assignmentJustification",
    c."parsedData",
    COALESCE(person_profile.custom_attributes, c."customAttributes") AS "customAttributes",
    COALESCE(person_profile.education, c."educationData") AS "educationData",
    COALESCE(person_profile.work_experience, c."experienceData") AS "experienceData",
    to_jsonb(person_profile) AS "personProfile",
    c.expected_salary as "expectedSalary",
    c."createdAt",
    c."updatedAt",
    c."applicationDate",
    c."isPinned",
    c."pinnedAt",
    c."isBlacklisted",
    linked_employee.id as "employeeId",
    linked_employee.employee_number as "employeeNumber",
    co.id as "companyLookupId",
    co.name as "companyName",
    co.legal_name as "companyLegalName",
    co.logo as "companyLogo",
    co.website as "companyWebsite",
    co.domain as "companyDomain",
    co.industry as "companyIndustry",
    co.description as "companyDescription",
    co.email as "companyEmail",
    co.phone as "companyPhone",
    co.address as "companyAddress",
    co.country as "companyCountry",
    p.title as "positionTitle", 
    p.department as "positionDepartment",
    p."companyId" as "positionCompanyId",
    r.name as "recruiterName", 
    r."avatarUrl" as "recruiterAvatarUrl",
    cs.name as "sourceName", 
    cs.description as "sourceDescription", 
    cs.logo as "sourceLogo"
  FROM "Applicant" c
  LEFT JOIN "person_profiles" person_profile ON person_profile.id = c.person_profile_id
  LEFT JOIN "Position" p ON c."positionId" = p.id
  LEFT JOIN "CompanyReference" co ON co.id = COALESCE(c."companyId", p."companyId")
  LEFT JOIN "User" r ON c."recruiterId" = r.id
  LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
  LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
  LEFT JOIN LATERAL (
    SELECT e.id, e.employee_number
    FROM hr_employees e
    WHERE e.person_profile_id = c.person_profile_id
       OR e.applicant_id = c.id
       OR (e.applicant_id IS NULL AND lower(e.email) = lower(c.email))
    ORDER BY CASE WHEN e.applicant_id = c.id THEN 0 ELSE 1 END, e.created_at DESC
    LIMIT 1
  ) linked_employee ON TRUE
  WHERE c.id = $1::uuid
`;

export const APPLICANT_DETAIL_JOB_MATCHES_QUERY = `
  SELECT 
    jm.id,
    jm."applicant_id",
    jm."jobId",
    jm."fitScore",
    jm."createdAt",
    jm."updatedAt",
    p.title as "positionTitle",
    p.department as "positionDepartment",
    p.description as "positionDescription"
  FROM "JobMatch" jm
  LEFT JOIN "Position" p ON jm."jobId" = p.id
  WHERE jm."applicant_id" = $1::uuid
  ORDER BY jm."fitScore" DESC
  LIMIT 3
`;

export const APPLICANT_DETAIL_ATTACHMENTS_QUERY = `
  SELECT 
    a.id,
    a."applicantId",
    a."uploadedById",
    a."filePath",
    a."fileName",
    a.label,
    a."isPrimary",
    a."uploadedAt",
    a."updatedAt",
    a."headcountId",
    u.name as "uploadedByUserName"
  FROM "Attachment" a
  LEFT JOIN "User" u ON a."uploadedById" = u.id
  WHERE a."applicantId" = $1::uuid
  ORDER BY a."uploadedAt" DESC
  LIMIT 2
`;

export const COMPANY_REFERENCES_BY_IDS_QUERY = `
  SELECT
    id,
    name,
    legal_name as "legalName",
    logo,
    website,
    domain,
    industry,
    description,
    email,
    phone,
    address,
    country,
    metadata,
    source,
    external_id as "externalId",
    appkit_app_id as "appkitAppId",
    sort_order as "sortOrder",
    is_active as "isActive"
  FROM "CompanyReference"
  WHERE id = ANY($1::uuid[])
`;

export const APPLICANT_AFTER_UPDATE_QUERY = `
  SELECT c.*, c."isBlacklisted",
         COALESCE(NULLIF(concat_ws(' ', person_profile.first_name, person_profile.last_name), ''), c.name) AS name,
         COALESCE(person_profile.email, c.email) AS email,
         COALESCE(person_profile.phone, c.phone) AS phone,
         COALESCE(person_profile.avatar_url, c."avatarUrl") AS "avatarUrl",
         COALESCE(person_profile.custom_attributes, c."customAttributes") AS "customAttributes",
         COALESCE(person_profile.education, c."educationData") AS "educationData",
         COALESCE(person_profile.work_experience, c."experienceData") AS "experienceData",
         to_jsonb(person_profile) AS "personProfile",
         co.id as "companyLookupId", co.name as "companyName", co.legal_name as "companyLegalName",
         co.logo as "companyLogo", co.website as "companyWebsite", co.domain as "companyDomain",
         co.industry as "companyIndustry", co.description as "companyDescription",
         co.email as "companyEmail", co.phone as "companyPhone", co.address as "companyAddress",
         co.country as "companyCountry",
         p.title as "positionTitle", p.department as "positionDepartment", p."companyId" as "positionCompanyId", r.name as "recruiterName",
         cs.name as "sourceName", cs.description as "sourceDescription", cs.logo as "sourceLogo",
         linked_employee.id as "employeeId", linked_employee.employee_number as "employeeNumber"
  FROM "Applicant" c
  LEFT JOIN "person_profiles" person_profile ON person_profile.id = c.person_profile_id
  LEFT JOIN "Position" p ON c."positionId" = p.id
  LEFT JOIN "CompanyReference" co ON co.id = COALESCE(c."companyId", p."companyId")
  LEFT JOIN "User" r ON c."recruiterId" = r.id
  LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
  LEFT JOIN LATERAL (
    SELECT e.id, e.employee_number
    FROM hr_employees e
    WHERE e.person_profile_id = c.person_profile_id
       OR e.applicant_id = c.id
       OR (e.applicant_id IS NULL AND lower(e.email) = lower(c.email))
    ORDER BY CASE WHEN e.applicant_id = c.id THEN 0 ELSE 1 END, e.created_at DESC
    LIMIT 1
  ) linked_employee ON TRUE
  WHERE c.id = $1::uuid;
`;

export const APPLICANT_UPDATE_JOB_MATCHES_QUERY = `
  SELECT jm.*, p.title as "positionTitle"
  FROM "JobMatch" jm
  LEFT JOIN "Position" p ON jm."jobId" = p.id
  WHERE jm."applicant_id" = $1::uuid
  ORDER BY jm."fitScore" DESC;
`;

export const APPLICANT_UPDATE_ATTACHMENTS_QUERY = `
  SELECT 
    a.id,
    a."applicantId",
    a."uploadedById",
    a."filePath",
    a."fileName",
    a.label,
    a."isPrimary",
    a."uploadedAt",
    a."updatedAt",
    a."headcountId",
    u.name as "uploadedByUserName"
  FROM "Attachment" a
  LEFT JOIN "User" u ON a."uploadedById" = u.id
  WHERE a."applicantId" = $1::uuid
  ORDER BY a."uploadedAt" DESC;
`;
