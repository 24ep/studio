import { executeAssignRecruiterBulkAction } from './bulk-action-route-recruiter';
import { executeChangeStatusBulkAction } from './bulk-action-route-status';
import { executeDeleteBulkAction } from './bulk-action-route-delete';
import { executeReprocessBulkAction } from './bulk-action-route-reprocess';
import type { BulkActionActionResult, BulkActionExecutionContext } from './bulk-action-route-types';

export async function executeBulkApplicantAction(context: BulkActionExecutionContext): Promise<BulkActionActionResult> {
  switch (context.data.action) {
    case 'delete':
      return await executeDeleteBulkAction(context);
    case 'change_status':
      return await executeChangeStatusBulkAction(context);
    case 'assign_recruiter':
      return await executeAssignRecruiterBulkAction(context);
    case 'reprocess':
      return await executeReprocessBulkAction(context);
    default:
      throw new Error(`Unknown action: ${context.data.action}`);
  }
}
