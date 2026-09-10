import { getPool } from "@/lib/db";

import {
  getErrorMessage,
  logError,
  logInfo,
  logSuccess,
  logWarning,
} from "./fit-score-performance-logger";

type IndexRow = {
  indexname: string;
};

const FIT_SCORE_INDEXES = [
  {
    name: "idx_Applicant_fit_score_position",
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_Applicant_fit_score_position ON "Applicant" ("fitScore", "positionId") WHERE "fitScore" IS NOT NULL',
  },
  {
    name: "idx_Applicant_fit_score_updated",
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_Applicant_fit_score_updated ON "Applicant" ("fitScore", "updatedAt") WHERE "fitScore" IS NOT NULL',
  },
  {
    name: "idx_Applicant_position_fit_score",
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_Applicant_position_fit_score ON "Applicant" ("positionId", "fitScore") WHERE "fitScore" IS NOT NULL',
  },
  {
    name: "idx_Applicant_status_fit_score",
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_Applicant_status_fit_score ON "Applicant" ("status", "fitScore") WHERE "fitScore" IS NOT NULL',
  },
];

export async function applyFitScoreIndexes() {
  const client = await getPool().connect();

  try {
    logInfo("Applying fit score performance indexes...");

    const existingIndexesResult = await client.query<IndexRow>(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'Applicant'
      AND indexname LIKE '%fit_score%'
    `);

    const existingIndexes = existingIndexesResult.rows.map((row) => row.indexname);
    logInfo(`Found ${existingIndexes.length} existing fit score indexes`);

    let createdIndexes = 0;
    let skippedIndexes = 0;

    for (const index of FIT_SCORE_INDEXES) {
      if (existingIndexes.includes(index.name)) {
        logInfo(`Index ${index.name} already exists, skipping`);
        skippedIndexes++;
        continue;
      }

      try {
        await client.query(index.sql);
        logSuccess(`Created index: ${index.name}`);
        createdIndexes++;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes("already exists")) {
          logInfo(`Index ${index.name} already exists, skipping`);
          skippedIndexes++;
        } else {
          logWarning(`Failed to create index ${index.name}: ${errorMessage}`);
        }
      }
    }

    logSuccess(`Index creation completed: ${createdIndexes} created, ${skippedIndexes} skipped`);
    return true;
  } catch (error: unknown) {
    logError(`Failed to apply fit score indexes: ${getErrorMessage(error)}`);
    console.error(error);
    return false;
  } finally {
    client.release();
  }
}
