import { getPool } from "@/lib/db";

import { getErrorMessage, logError, logInfo, logSuccess } from "./fit-score-performance-logger";

type CountRow = {
  count: string | number;
};

export async function optimizeFitScoreCalculations() {
  const client = await getPool().connect();

  try {
    logInfo("Optimizing fit score calculations...");

    await client.query('ANALYZE "Applicant"');
    await client.query('ANALYZE "Position"');

    logSuccess("Updated table statistics for better query planning");

    const fitScoreResult = await client.query<CountRow>(`
      SELECT COUNT(*) as count
      FROM "Applicant" c
      WHERE c."fitScore" IS NOT NULL
    `);

    const fitScoreCount = Number(fitScoreResult.rows[0].count);
    if (fitScoreCount > 0) {
      logInfo(`Found ${fitScoreCount} Applicants with fit scores`);
      logInfo("Note: Cannot determine if fit scores are outdated without fitScoreUpdatedAt column");
    } else {
      logInfo("No Applicants with fit scores found");
    }

    return true;
  } catch (error: unknown) {
    logError(`Failed to optimize fit score calculations: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    client.release();
  }
}
