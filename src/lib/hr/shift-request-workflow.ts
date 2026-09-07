export type ShiftRequestOwnerAction =
  | 'update_shift_request'
  | 'submit_shift_request'
  | 'withdraw_shift_request'
  | 'cancel_shift_request'
  | 'resubmit_shift_request';

export type ShiftRequestType =
  | 'shift_change'
  | 'shift_swap'
  | 'open_shift'
  | 'temporary_schedule_change'
  | 'work_location_change'
  | 'rest_day_change'
  | 'drop_shift'
  | 'cover_shift'
  | 'availability_update';

export function shiftRequestSubmissionStatus(requestType: ShiftRequestType) {
  return requestType === 'shift_swap' ? 'awaiting_employee' : 'pending_approval';
}

export function shiftRequestOwnerTransition(
  status: string,
  action: ShiftRequestOwnerAction,
  requestType: ShiftRequestType,
): string | null {
  if (action === 'update_shift_request') {
    return ['draft', 'returned_for_revision'].includes(status) ? status : null;
  }
  if (action === 'submit_shift_request') {
    return status === 'draft' ? shiftRequestSubmissionStatus(requestType) : null;
  }
  if (action === 'resubmit_shift_request') {
    return status === 'returned_for_revision' ? shiftRequestSubmissionStatus(requestType) : null;
  }
  if (action === 'withdraw_shift_request') {
    return ['pending_approval', 'awaiting_employee', 'returned_for_revision'].includes(status) ? 'withdrawn' : null;
  }
  if (action === 'cancel_shift_request') {
    return ['draft', 'returned_for_revision', 'withdrawn'].includes(status) ? 'cancelled' : null;
  }
  return null;
}

export function validateShiftRequestTarget(input: {
  requestType: ShiftRequestType;
  assignmentId?: string | null;
  requestedAssignmentId?: string | null;
  swapEmployeeId?: string | null;
  openShiftId?: string | null;
}) {
  const { requestType } = input;
  if (requestType === 'shift_swap') {
    if (!input.assignmentId || !input.swapEmployeeId || !input.requestedAssignmentId) {
      return 'Select your shift, a colleague, and the colleague shift to swap.';
    }
  }
  if (requestType === 'open_shift' && !input.openShiftId) {
    return 'Select an open shift.';
  }
  if (requestType === 'cover_shift' && !input.requestedAssignmentId && !input.openShiftId) {
    return 'Select a shift to cover.';
  }
  if (['shift_change', 'temporary_schedule_change', 'work_location_change', 'rest_day_change', 'drop_shift'].includes(requestType) && !input.assignmentId) {
    return 'Select the shift this request applies to.';
  }
  return null;
}
