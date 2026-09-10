#!/usr/bin/env tsx

/**
 * Fit Score Performance Optimization Script
 */

import "dotenv/config";

import { analyzeFitScorePerformance } from "./fit-score-performance-analysis";
import { applyFitScoreIndexes } from "./fit-score-performance-indexes";
import { getErrorMessage, log, logError, logInfo, logWarning } from "./fit-score-performance-logger";
import { optimizeFitScoreCalculations } from "./fit-score-performance-maintenance";

async function main() {
  log("[start] Starting fit score performance optimization...", "cyan");

  try {
    logInfo("Step 1: Applying database indexes...");
    const indexesSuccess = await applyFitScoreIndexes();

    logInfo("Step 2: Analyzing fit score performance...");
    const analysisSuccess = await analyzeFitScorePerformance();

    logInfo("Step 3: Optimizing fit score calculations...");
    const optimizationSuccess = await optimizeFitScoreCalculations();

    if (!indexesSuccess || !analysisSuccess || !optimizationSuccess) {
      logWarning("Some optimization steps failed, but continuing...");
    }

    process.exit(0);
  } catch (error: unknown) {
    logError(`Fit score optimization failed: ${getErrorMessage(error)}`);
    console.error(error);
    process.exit(1);
  }
}

export {
  applyFitScoreIndexes,
  analyzeFitScorePerformance,
  optimizeFitScoreCalculations,
};

if (require.main === module) {
  main().catch((error: unknown) => {
    logError(`Unexpected error: ${getErrorMessage(error)}`);
    console.error(error);
    process.exit(1);
  });
}
