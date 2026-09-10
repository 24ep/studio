type QueryParam = number | string | string[];

export type V1PositionListQuery = {
  query: string;
  countQuery: string;
  queryParams: QueryParam[];
  countParams: QueryParam[];
};

const POSITION_LIST_SELECT = `
  SELECT p.id, p.title, p.department, p.description, p."matchCriteria", p."isOpen", p."positionLevel",
         p."gradeId", p."recruiterId", p."customAttributes", p."createdAt", p."updatedAt",
         u.name as "recruiterName", u.email as "recruiterEmail"
  FROM "Position" p
  LEFT JOIN "User" u ON p."recruiterId" = u.id
`;

const POSITION_COUNT_SELECT = 'SELECT COUNT(*) FROM "Position" p';

export function buildV1PositionListQuery(searchParams: URLSearchParams): V1PositionListQuery {
  const conditions: string[] = [];
  const queryParams: QueryParam[] = [];
  let paramIndex = 1;

  const titleFilter = searchParams.get("title");
  if (titleFilter) {
    conditions.push(`p.title ILIKE $${paramIndex++}`);
    queryParams.push(`%${titleFilter}%`);
  }

  const departmentFilter = searchParams.get("department");
  if (departmentFilter) {
    conditions.push(`p.department = ANY($${paramIndex++}::text[])`);
    queryParams.push(departmentFilter.split(",").map(department => department.trim()));
  }

  const isOpenFilter = searchParams.get("isOpen");
  if (isOpenFilter === "true") {
    conditions.push('p."isOpen" = TRUE');
  } else if (isOpenFilter === "false") {
    conditions.push('p."isOpen" = FALSE');
  }

  const positionLevelFilter = searchParams.get("positionLevel");
  if (positionLevelFilter) {
    conditions.push(`p."positionLevel" ILIKE $${paramIndex++}`);
    queryParams.push(`%${positionLevelFilter}%`);
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const countParams = [...queryParams];
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  return {
    query: `${POSITION_LIST_SELECT}${whereClause} ORDER BY p."createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    countQuery: `${POSITION_COUNT_SELECT}${whereClause}`,
    queryParams: [...queryParams, limit, offset],
    countParams,
  };
}
