export const BASE_SELECT = `
  SELECT
    p.id,
    p.title,
    p.department,
    p.description,
    p."matchCriteria",
    p."isOpen",
    p."positionLevel",
    p."gradeId",
    p."recruiterId",
    p.organization_unit_id AS "organizationUnitId",
    p."customAttributes",
    p."createdAt",
    p."updatedAt",
    u.name as "recruiterName",
    g.name as "gradeName",
    g."sla_days" as "gradeSlaDays",
    g.color as "gradeColor",
    json_build_object(
      'id', p."gradeId",
      'name', g.name,
      'label', g.label,
      'slaDays', g."sla_days",
      'color', g.color
    ) as grade`;

export const HEADCOUNT_SELECT = `,
    COALESCE(hc_stats.total_headcount, 0) as "totalHeadcount",
    COALESCE(hc_stats.vacant_headcount, 0) as "vacantHeadcount",
    COALESCE(hc_stats.filled_headcount, 0) as "filledHeadcount"`;

export const BASE_FROM = `
  FROM "Position" p
  LEFT JOIN "User" u ON p."recruiterId" = u.id
  LEFT JOIN "Grade" g ON p."gradeId" = g.id`;

export const HEADCOUNT_JOIN = `
  LEFT JOIN (
    SELECT
      h."positionId",
      COUNT(*) as total_headcount,
      COUNT(CASE WHEN h.status = 'vacant' OR h."applicantId" IS NULL THEN 1 END) as vacant_headcount,
      COUNT(CASE WHEN h.status = 'filled' AND h."applicantId" IS NOT NULL THEN 1 END) as filled_headcount
    FROM "Headcount" h
    GROUP BY h."positionId"
  ) hc_stats ON p.id = hc_stats."positionId"`;
