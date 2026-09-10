import { Pool } from 'pg';

type UnresolvedPosition = {
  id: string;
  title: string;
  department: string;
  resolutionStatus: 'unmatched' | 'ambiguous';
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const result = await pool.query<UnresolvedPosition>(`
      SELECT position.id, position.title, position.department,
             CASE WHEN COUNT(department.id) = 0 THEN 'unmatched' ELSE 'ambiguous' END AS "resolutionStatus"
      FROM "Position" position
      LEFT JOIN hr_departments department
        ON lower(trim(department.name)) = lower(trim(position.department))
       AND department.unit_type = 'department'
       AND department.is_active = true
      WHERE position.organization_unit_id IS NULL
      GROUP BY position.id, position.title, position.department
      ORDER BY position.department, position.title
    `);
    if (result.rows.length === 0) {
      console.log('All positions have organization links.');
    } else {
      console.warn(`POSITION_ORGANIZATION_REVIEW_REQUIRED count=${result.rows.length}`);
      console.table(result.rows);
    }
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Unable to report unresolved position organization links:', error);
  process.exitCode = 1;
});
