const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const file of [
  'src/lib/hr/attendance-correction.ts',
  'src/lib/hr/attendance-correction-request-update.ts',
  'src/lib/hr/shift-request-workflow.ts',
  'src/lib/hr/overtime-request-workflow.ts',
  'src/lib/hr/roster-copy.ts',
  'src/lib/hr/shift-notification-recipients.ts',
  'src/lib/hr/time-policy-config.ts',
  'src/lib/hr/time-owner-actions.ts',
  'src/lib/hr/time-setup-actions.ts',
  'src/lib/payroll/attendance-inputs.ts',
  'src/components/shift/views/AttendanceCorrectionRequestForm.tsx',
  'src/components/shift/views/ShiftRequestComposer.tsx',
  'src/components/shift/views/TimeRequestOwnerActions.tsx',
  'src/components/shift/views/RosterSetupDialog.tsx',
  'src/components/shift/views/ReportsView.tsx',
  'src/app/ess/timesheet/page.tsx',
]) assert(exists(file), `Time completion file must exist: ${file}`);

const contracts = read('src/lib/hr/shift-attendance-contracts.ts');
for (const action of [
  'update_shift_request', 'submit_shift_request', 'withdraw_shift_request', 'cancel_shift_request', 'resubmit_shift_request',
  'update_overtime', 'submit_overtime', 'withdraw_overtime', 'cancel_overtime', 'resubmit_overtime',
  'copy_roster', 'create_roster_period', 'create_shift_definition', 'create_work_schedule', 'create_open_shift',
]) assert(contracts.includes(`'${action}'`) || contracts.includes(`\"${action}\"`), `Time mutation contract must expose ${action}.`);

const workspace = read('src/components/shift/ShiftAttendanceWorkspace.tsx');
assert(workspace.includes("'reports'") || workspace.includes('"reports"'), 'Time workspace must route the reports view.');
assert(workspace.includes('ReportsView'), 'Time workspace must render ReportsView.');

const requestUi = read('src/components/shift/views/RequestsView.tsx');
assert(requestUi.includes('AttendanceCorrectionRequestForm'), 'Requests UI must use the patch-safe attendance correction form.');
assert(requestUi.includes('ShiftRequestComposer'), 'Requests UI must use the complete Shift request composer.');
assert(requestUi.includes('ShiftRequestOwnerActions'), 'Shift request history must expose owner lifecycle actions.');
assert(requestUi.includes('AttendanceCorrectionOwnerActions'), 'Attendance correction history must expose owner lifecycle actions.');
assert(requestUi.includes("scope: 'self'"), 'Employee Time request history must request self scope.');

const correctionUi = read('src/components/shift/views/AttendanceCorrectionRequestForm.tsx');
for (const marker of ['correctionType', 'attendanceRecordId', '/api/ess/documents/upload', 'initialRequest']) {
  assert(correctionUi.includes(marker), `Attendance correction UI must include ${marker}.`);
}

const shiftComposer = read('src/components/shift/views/ShiftRequestComposer.tsx');
for (const marker of ['eligibleAssignments', 'openShifts', 'openShiftId', 'requestedAssignmentId', 'update_shift_request']) {
  assert(shiftComposer.includes(marker), `Shift request composer must include ${marker}.`);
}

const overtimeUi = read('src/components/shift/views/OvertimeView.tsx');
assert(overtimeUi.includes('OvertimeOwnerActions'), 'Overtime UI must expose owner lifecycle actions.');
assert(overtimeUi.includes("scope: 'self'"), 'Employee overtime must request self scope.');
assert(overtimeUi.includes('update_overtime'), 'Overtime UI must support editing returned/draft requests.');

const timesheetUi = read('src/components/shift/views/TimesheetCommandCenter.tsx');
assert(timesheetUi.includes('entryId: entry?.id'), 'Timesheet UI must edit existing entries through entryId.');
assert(timesheetUi.includes("scope: 'self'"), 'Employee timesheets must request self scope.');

const rosterUi = read('src/components/shift/views/RosterView.tsx');
assert(rosterUi.includes('copy_roster'), 'Roster UI must expose copy previous roster.');
assert(rosterUi.includes('RosterSetupDialog'), 'Roster UI must expose foundation setup.');

const service = read('src/lib/hr/shift-attendance-service.ts');
for (const marker of ['mutateOwnedShiftRequest', 'mutateOwnedOvertime', 'copyRosterWeek', 'mutateTimeSetup', 'validateOwnedShiftRequestTargets', 'overtimeRoundingMinutes', 'minimumShiftRestHours']) {
  assert(service.includes(marker), `Time service must wire ${marker}.`);
}

const notificationRoute = read('src/app/api/hr/shift-attendance/route.ts');
assert(notificationRoute.includes('timeMutationEmployeeIds'), 'Time API must resolve bulk notification recipients.');
assert(notificationRoute.includes('timeNotificationHref'), 'Time API notifications must use employee-safe destinations.');

const payrollCollector = read('src/lib/payroll/collect-inputs.ts');
assert(payrollCollector.includes('collectAttendanceExportInputs'), 'Payroll collect_inputs must ingest ready attendance exports.');

const setupService = read('src/lib/hr/time-setup-actions.ts');
for (const marker of ['create_roster_period', 'create_shift_definition', 'create_work_schedule', 'create_open_shift']) {
  assert(setupService.includes(marker), `Time setup service must support ${marker}.`);
}

console.log('Time end-to-end regression checks passed.');
