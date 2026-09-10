import { getPool } from '@/lib/db';

const APPLICANT_STATS_QUERY = `
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN rs.name = 'Applied' THEN 1 END) as new,
    COUNT(CASE WHEN rs.name NOT IN ('Applied', 'Hired', 'Rejected') OR rs.name IS NULL THEN 1 END) as "inProgress",
    COUNT(CASE WHEN rs.name = 'Hired' THEN 1 END) as hired,
    COUNT(CASE WHEN rs.name = 'Rejected' THEN 1 END) as rejected
  FROM "Applicant" c
  LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
`;

const POSITION_STATS_QUERY = `
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN "isOpen" = true THEN 1 END) as open,
    COUNT(CASE WHEN "isOpen" = false THEN 1 END) as closed
  FROM "Position"
`;

const APPLICATION_STATS_QUERY = `
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN "applicationDate" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as "thisMonth",
    COUNT(CASE WHEN "applicationDate" >= CURRENT_DATE - INTERVAL '60 days' AND "applicationDate" < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as "lastMonth"
  FROM "Applicant"
`;

const RECRUITER_STATS_QUERY = `
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN "is_active" = true THEN 1 END) as active
  FROM "User"
  WHERE role = 'Recruiter'
`;

const RECENT_ACTIVITY_QUERY = `
  SELECT 
    id,
    action_type as type,
    message,
    created_at as timestamp,
    user_id as "userId",
    user_name as "userName"
  FROM "AuditLog"
  ORDER BY created_at DESC
  LIMIT 10
`;

export async function fetchDashboardV1Data() {
  const [applicantStats, positionStats, applicationStats, recruiterStats, recentActivity] =
    await fetchDashboardV1QueryResults();

  return {
    applicantStats: applicantStats.rows[0],
    positionStats: positionStats.rows[0],
    applicationStats: applicationStats.rows[0],
    recruiterStats: recruiterStats.rows[0],
    recentActivity: recentActivity.rows,
  };
}

async function fetchDashboardV1QueryResults() {
  const pool = getPool();

  return Promise.all([
    pool.query(APPLICANT_STATS_QUERY),
    pool.query(POSITION_STATS_QUERY),
    pool.query(APPLICATION_STATS_QUERY),
    pool.query(RECRUITER_STATS_QUERY),
    pool.query(RECENT_ACTIVITY_QUERY),
  ]);
}
