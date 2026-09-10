interface SLAQuerySpec {
  query: string;
  params: unknown[];
}

export function buildAllSLAPositionsQuery(recruiterId?: string): SLAQuerySpec {
  const params: unknown[] = [];
  let query = `
    SELECT 
      p.id,
      p.title,
      p.department,
      MIN(h."requestDate") as "requestDate",
      p."recruiterId",
      u.name as "recruiterName",
      g.name as "gradeName",
      g."sla_days" as "slaDays",
      g.color as "gradeColor",
      p."createdAt"
    FROM "Position" p
    LEFT JOIN "User" u ON p."recruiterId" = u.id
    LEFT JOIN "Grade" g ON p."gradeId" = g.id
    LEFT JOIN "Headcount" h ON p.id = h."positionId"
    WHERE p."gradeId" IS NOT NULL
      AND p."isOpen" = true
      AND h."requestDate" IS NOT NULL
  `;

  if (recruiterId) {
    query += ` AND p."recruiterId" = $1`;
    params.push(recruiterId);
  }

  query += `
    GROUP BY p.id, p.title, p.department, p."recruiterId", u.name, g.name, g."sla_days", g.color, p."createdAt"
    ORDER BY MIN(h."requestDate") ASC
  `;

  return { query, params };
}

export function buildPositionsWithoutSLAQuery(recruiterId?: string): SLAQuerySpec {
  const params: unknown[] = [];
  let query = `
    SELECT 
      p.id as "positionId",
      p.title as "positionTitle",
      p.department,
      p."recruiterId",
      u.name as "recruiterName",
      p."createdAt"
    FROM "Position" p
    LEFT JOIN "User" u ON p."recruiterId" = u.id
    WHERE p."gradeId" IS NULL
      AND p."isOpen" = true
  `;

  if (recruiterId) {
    query += ` AND p."recruiterId" = $1`;
    params.push(recruiterId);
  }

  query += ` ORDER BY p."createdAt" DESC`;

  return { query, params };
}

export function buildAllSLAHeadcountsQuery(recruiterId?: string): SLAQuerySpec {
  const params: unknown[] = [];
  let query = `
    SELECT 
      h.id as "headcountId",
      h."positionId",
      h.type as "headcountType",
      h.status as "headcountStatus",
      h."applicantId",
      h."requestDate",
      h."onboardingDate",
      p.title as "positionTitle",
      p.department as "positionDepartment",
      p."recruiterId",
      u.name as "recruiterName",
      g.name as "gradeName",
      g."sla_days" as "slaDays",
      g.color as "gradeColor",
      h."createdAt"
    FROM "Headcount" h
    LEFT JOIN "Position" p ON h."positionId" = p.id
    LEFT JOIN "User" u ON p."recruiterId" = u.id
    LEFT JOIN "Grade" g ON p."gradeId" = g.id
    WHERE p."gradeId" IS NOT NULL
      AND p."isOpen" = true
      AND h."requestDate" IS NOT NULL
  `;

  if (recruiterId) {
    query += ` AND p."recruiterId" = $1`;
    params.push(recruiterId);
  }

  query += ` ORDER BY h."requestDate" ASC`;

  return { query, params };
}

export function buildSLAViolationsForRecruiterQuery(): SLAQuerySpec {
  return {
    query: `
      SELECT 
        p.id,
        p.title,
        MIN(h."requestDate") as "requestDate",
        p."recruiterId",
        u.name as "recruiterName",
        g.name as "gradeName",
        g."sla_days" as "slaDays",
        g.color as "gradeColor"
      FROM "Position" p
      LEFT JOIN "User" u ON p."recruiterId" = u.id
      LEFT JOIN "Grade" g ON p."gradeId" = g.id
      LEFT JOIN "Headcount" h ON p.id = h."positionId"
      WHERE p."recruiterId" = $1
        AND p."gradeId" IS NOT NULL
        AND p."isOpen" = true
        AND h."requestDate" IS NOT NULL
      GROUP BY p.id, p.title, p."recruiterId", u.name, g.name, g."sla_days", g.color
    `,
    params: [],
  };
}
