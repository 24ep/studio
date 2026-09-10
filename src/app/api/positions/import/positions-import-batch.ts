import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { broadcastPositionListUpdated, broadcastPositionStatisticsUpdated } from '@/lib/simple-broadcaster';
import { BATCH_SIZE, TIMEOUT_MS, type ImportBatchResults, type ImportPosition, type ImportTotals } from './positions-import-schema';

export interface ExecuteImportOptions {
  positions: ImportPosition[];
  defaultMatchCriteria: string;
  actingUserId: string;
  actingUserName: string;
  auditInput: unknown;
  successAuditLabel: string;
  timeoutMessage: string;
}

type PositionIdentityRow = QueryResultRow & {
  title: string;
  department: string | null;
};

type PositionStatsRow = QueryResultRow & {
  total: string;
  open: string;
  closed: string;
};

async function processBatch(client: DbClient, positions: ImportPosition[], defaultMatchCriteria: string): Promise<ImportBatchResults> {
  const results: ImportBatchResults = {
    success: 0,
    failed: 0,
    errors: [],
  };

  const existingTitles = positions.map((position) => [position.title, position.department]);
  const existingQuery = `
    SELECT title, department FROM "Position"
    WHERE (title, department) IN (${existingTitles.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ')})
  `;
  const existingResult = await client.query<PositionIdentityRow>(existingQuery, existingTitles.flat());
  const existingSet = new Set(existingResult.rows.map((row) => `${row.title}|${row.department}`));
  const newPositions = positions.filter((position) => !existingSet.has(`${position.title}|${position.department}`));

  if (newPositions.length === 0) {
    results.failed = positions.length;
    results.errors.push(`All ${positions.length} positions already exist`);
    return results;
  }

  const insertValues = newPositions.map((_, index) => {
    const baseIndex = index * 8;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, NOW(), NOW())`;
  }).join(', ');

  const insertParams = newPositions.flatMap((position) => [
    uuidv4(),
    position.title,
    position.department,
    position.description,
    position.matchCriteria || defaultMatchCriteria,
    position.isOpen,
    position.positionLevel,
    position.custom_attributes || {},
  ]);

  try {
    await client.query(
      `
        INSERT INTO "Position" (id, title, department, description, "matchCriteria", "isOpen", "positionLevel", "customAttributes", "createdAt", "updatedAt")
        VALUES ${insertValues}
        RETURNING id, title, department;
      `,
      insertParams
    );
    results.success = newPositions.length;
  } catch (error) {
    results.failed = newPositions.length;
    results.errors.push(`Batch insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const duplicateCount = positions.length - newPositions.length;
  results.failed += duplicateCount;
  if (duplicateCount > 0) {
    results.errors.push(`${duplicateCount} positions already exist`);
  }

  return results;
}

async function broadcastImportUpdates(client: DbClient): Promise<void> {
  broadcastPositionListUpdated();

  const statsResult = await client.query<PositionStatsRow>(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN "isOpen" = TRUE THEN 1 END) as open,
      COUNT(CASE WHEN "isOpen" = FALSE THEN 1 END) as closed
    FROM "Position"
  `);
  const stats = statsResult.rows[0];
  broadcastPositionStatisticsUpdated({
    total: parseInt(stats.total, 10),
    open: parseInt(stats.open, 10),
    closed: parseInt(stats.closed, 10),
  });
}

export async function executePositionImport(options: ExecuteImportOptions) {
  const client: DbClient = await getPool().connect();
  const startTime = Date.now();

  try {
    await client.query('BEGIN');

    const totalResults: ImportTotals = {
      success: 0,
      failed: 0,
      errors: [],
      processingTime: 0,
    };

    for (let index = 0; index < options.positions.length; index += BATCH_SIZE) {
      const batch = options.positions.slice(index, index + BATCH_SIZE);
      const batchResults = await processBatch(client, batch, options.defaultMatchCriteria);

      totalResults.success += batchResults.success;
      totalResults.failed += batchResults.failed;
      totalResults.errors.push(...batchResults.errors);

      if (Date.now() - startTime > TIMEOUT_MS) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          message: options.timeoutMessage,
          partialResults: totalResults,
        }, { status: 408 });
      }
    }

    await client.query('COMMIT');
    totalResults.processingTime = Date.now() - startTime;

    if (totalResults.success > 0) {
      try {
        await broadcastImportUpdates(client);
      } catch (broadcastError) {
        console.error('Failed to broadcast real-time updates after import:', broadcastError);
      }
    }

    await logAudit(
      'AUDIT',
      `${options.successAuditLabel} by ${options.actingUserName}. Success: ${totalResults.success}, Failed: ${totalResults.failed}, Time: ${totalResults.processingTime}ms`,
      'API:Positions:Import',
      options.actingUserId,
      { results: totalResults }
    );

    return NextResponse.json({
      message: 'Import completed',
      ...totalResults,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logAudit('ERROR', `Bulk import failed. Error: ${errorMessage}`, 'API:Positions:Import', options.actingUserId, { input: options.auditInput });
    return NextResponse.json({ message: 'Error during import', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
