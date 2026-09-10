import { getPool } from "@/lib/db";

import { getErrorMessage, logError, logInfo, logSuccess } from "./fit-score-performance-logger";

type FitScoreStatsRow = {
  applicantS_with_fit_score: string | number;
  avg_fit_score: string | number | null;
  min_fit_score: string | number | null;
  max_fit_score: string | number | null;
  unique_positions: string | number;
};

type FitScoreDistributionRow = {
  score_range: string;
  count: string | number;
};

type TopPositionRow = {
  position_title: string;
  Applicant_count: string | number;
  avg_fit_score: string | number | null;
};

function logFitScoreStats(stats: FitScoreStatsRow) {
  logInfo("Fit Score Statistics:");
  logInfo(`  - Total Applicants with fit scores: ${stats.applicantS_with_fit_score}`);
  logInfo(`  - Average fit score: ${stats.avg_fit_score}`);
  logInfo(`  - Fit score range: ${stats.min_fit_score} - ${stats.max_fit_score}`);
  logInfo(`  - Unique positions: ${stats.unique_positions}`);
}

function logFitScoreDistribution(rows: FitScoreDistributionRow[]) {
  logInfo("Fit Score Distribution:");
  for (const row of rows) {
    logInfo(`  - ${row.score_range}: ${row.count} Applicants`);
  }
}

function logTopPositions(rows: TopPositionRow[]) {
  logInfo("Top 10 Positions by Applicant Count:");
  for (const row of rows) {
    logInfo(`  - ${row.position_title}: ${row.Applicant_count} Applicants (avg: ${row.avg_fit_score})`);
  }
}

export async function analyzeFitScorePerformance() {
  const client = await getPool().connect();

  try {
    logInfo("Analyzing fit score query performance...");

    const statsResult = await client.query<FitScoreStatsRow>(`
      SELECT
        COUNT(*) as total_Applicants,
        COUNT("fitScore") as applicantS_with_fit_score,
        ROUND(AVG("fitScore")::numeric, 2) as avg_fit_score,
        MIN("fitScore") as min_fit_score,
        MAX("fitScore") as max_fit_score,
        COUNT(DISTINCT "positionId") as unique_positions
      FROM "Applicant"
      WHERE "fitScore" IS NOT NULL
    `);

    logFitScoreStats(statsResult.rows[0]);

    const distributionResult = await client.query<FitScoreDistributionRow>(`
      SELECT
        CASE
          WHEN "fitScore" >= 0.9 THEN '90-100 (Excellent)'
          WHEN "fitScore" >= 0.8 THEN '80-89 (Very Good)'
          WHEN "fitScore" >= 0.7 THEN '70-79 (Good)'
          WHEN "fitScore" >= 0.6 THEN '60-69 (Fair)'
          WHEN "fitScore" >= 0.5 THEN '50-59 (Poor)'
          ELSE '0-49 (Very Poor)'
        END as score_range,
        COUNT(*) as count
      FROM "Applicant"
      WHERE "fitScore" IS NOT NULL
      GROUP BY score_range
      ORDER BY MIN("fitScore") DESC
    `);

    logFitScoreDistribution(distributionResult.rows);

    const topPositionsResult = await client.query<TopPositionRow>(`
      SELECT
        p.title as position_title,
        COUNT(c.id) as Applicant_count,
        ROUND(AVG(c."fitScore")::numeric, 2) as avg_fit_score
      FROM "Applicant" c
      JOIN "Position" p ON c."positionId" = p.id
      WHERE c."fitScore" IS NOT NULL
      GROUP BY p.id, p.title
      ORDER BY Applicant_count DESC
      LIMIT 10
    `);

    logTopPositions(topPositionsResult.rows);
    logSuccess("Fit score performance analysis completed");
    return true;
  } catch (error: unknown) {
    logError(`Failed to analyze fit score performance: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    client.release();
  }
}
