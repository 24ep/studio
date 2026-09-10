import type { BulkActionExecutionContext, BulkActionExecutionResult } from './bulk-action-route-types';

export async function executeDeleteBulkAction({
  client,
  data,
}: BulkActionExecutionContext): Promise<BulkActionExecutionResult> {
  const deleteResult = await client.query('DELETE FROM "Applicant" WHERE id = ANY($1::uuid[]) RETURNING id', [
    data.applicantIds,
  ]);

  return {
    result: { deletedCount: deleteResult.rowCount },
    auditMessage: `Bulk deleted ${deleteResult.rowCount} Applicants`,
  };
}
