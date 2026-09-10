export type OvertimeOwnerAction =
  | 'update_overtime'
  | 'submit_overtime'
  | 'withdraw_overtime'
  | 'cancel_overtime'
  | 'resubmit_overtime';

export function overtimeOwnerTransition(status: string, action: OvertimeOwnerAction): string | null {
  if (action === 'update_overtime') {
    return ['draft', 'returned_for_revision'].includes(status) ? status : null;
  }
  if (action === 'submit_overtime') {
    return status === 'draft' ? 'pending_approval' : null;
  }
  if (action === 'resubmit_overtime') {
    return status === 'returned_for_revision' ? 'pending_approval' : null;
  }
  if (action === 'withdraw_overtime') {
    return ['pending_approval', 'returned_for_revision'].includes(status) ? 'withdrawn' : null;
  }
  if (action === 'cancel_overtime') {
    return ['draft', 'returned_for_revision', 'withdrawn'].includes(status) ? 'cancelled' : null;
  }
  return null;
}
