"use client";

import { Pencil, RotateCcw, Send, Undo2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { numberValue, stringValue, type ShiftRecord } from '../shift-types';

export function ShiftRequestOwnerActions({
  request,
  saving,
  onEdit,
  onAction,
}: {
  request: ShiftRecord;
  saving: boolean;
  onEdit: (request: ShiftRecord) => void;
  onAction: (body: Record<string, unknown>, message: string) => Promise<unknown>;
}) {
  const status = stringValue(request.status);
  const requestId = String(request.id);
  const version = numberValue(request.version);
  const editable = ['draft', 'returned_for_revision'].includes(status);
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800">
      {editable && <Button variant="outline" size="sm" disabled={saving} onClick={() => onEdit(request)}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
      {status === 'draft' && <Button size="sm" disabled={saving} onClick={() => void onAction({ action: 'submit_shift_request', requestId, expectedVersion: version }, 'Shift request submitted.')}><Send className="mr-1.5 h-4 w-4" />Submit</Button>}
      {status === 'returned_for_revision' && <Button size="sm" disabled={saving} onClick={() => void onAction({ action: 'resubmit_shift_request', requestId, expectedVersion: version }, 'Shift request resubmitted.')}><RotateCcw className="mr-1.5 h-4 w-4" />Resubmit</Button>}
      {['pending_approval', 'awaiting_employee', 'returned_for_revision'].includes(status) && <Button variant="outline" size="sm" disabled={saving} onClick={() => void onAction({ action: 'withdraw_shift_request', requestId, expectedVersion: version }, 'Shift request withdrawn.')}><Undo2 className="mr-1.5 h-4 w-4" />Withdraw</Button>}
      {['draft', 'returned_for_revision', 'withdrawn'].includes(status) && <Button variant="outline" size="sm" className="text-rose-600" disabled={saving} onClick={() => void onAction({ action: 'cancel_shift_request', requestId, expectedVersion: version }, 'Shift request cancelled.')}><X className="mr-1.5 h-4 w-4" />Cancel</Button>}
    </div>
  );
}

export function AttendanceCorrectionOwnerActions({
  request,
  saving,
  onEdit,
  onAction,
}: {
  request: ShiftRecord;
  saving: boolean;
  onEdit: (request: ShiftRecord) => void;
  onAction: (body: Record<string, unknown>, message: string) => Promise<unknown>;
}) {
  const status = stringValue(request.status);
  const id = String(request.id);
  const expectedVersion = numberValue(request.version);
  const editable = ['draft', 'returned_for_revision'].includes(status);
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800">
      {editable && <Button variant="outline" size="sm" disabled={saving} onClick={() => onEdit(request)}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
      {status === 'draft' && <Button size="sm" disabled={saving} onClick={() => void onAction({ id, action: 'submit', expectedVersion }, 'Attendance correction submitted.')}><Send className="mr-1.5 h-4 w-4" />Submit</Button>}
      {['returned_for_revision', 'withdrawn'].includes(status) && <Button size="sm" disabled={saving} onClick={() => void onAction({ id, action: 'resubmit', expectedVersion }, 'Attendance correction resubmitted.')}><RotateCcw className="mr-1.5 h-4 w-4" />Resubmit</Button>}
      {['submitted', 'pending_approval', 'returned_for_revision'].includes(status) && <Button variant="outline" size="sm" disabled={saving} onClick={() => void onAction({ id, action: 'withdraw', expectedVersion }, 'Attendance correction withdrawn.')}><Undo2 className="mr-1.5 h-4 w-4" />Withdraw</Button>}
      {['approved', 'processing'].includes(status) && <Button variant="outline" size="sm" className="text-rose-600" disabled={saving} onClick={() => void onAction({ id, action: 'cancel', expectedVersion }, 'Attendance correction cancelled.')}><X className="mr-1.5 h-4 w-4" />Cancel</Button>}
    </div>
  );
}

export function OvertimeOwnerActions({
  request,
  saving,
  onEdit,
  onAction,
}: {
  request: ShiftRecord;
  saving: boolean;
  onEdit: (request: ShiftRecord) => void;
  onAction: (body: Record<string, unknown>, message: string) => Promise<unknown>;
}) {
  const status = stringValue(request.status);
  const overtimeId = String(request.id);
  const expectedVersion = numberValue(request.version);
  const editable = ['draft', 'returned_for_revision'].includes(status);
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
      {editable && <Button variant="outline" size="sm" disabled={saving} onClick={() => onEdit(request)}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
      {status === 'draft' && <Button size="sm" disabled={saving} onClick={() => void onAction({ action: 'submit_overtime', overtimeId, expectedVersion }, 'Overtime request submitted.')}><Send className="mr-1.5 h-4 w-4" />Submit</Button>}
      {status === 'returned_for_revision' && <Button size="sm" disabled={saving} onClick={() => void onAction({ action: 'resubmit_overtime', overtimeId, expectedVersion }, 'Overtime request resubmitted.')}><RotateCcw className="mr-1.5 h-4 w-4" />Resubmit</Button>}
      {['pending_approval', 'returned_for_revision'].includes(status) && <Button variant="outline" size="sm" disabled={saving} onClick={() => void onAction({ action: 'withdraw_overtime', overtimeId, expectedVersion }, 'Overtime request withdrawn.')}><Undo2 className="mr-1.5 h-4 w-4" />Withdraw</Button>}
      {['draft', 'returned_for_revision', 'withdrawn'].includes(status) && <Button variant="outline" size="sm" className="text-rose-500" disabled={saving} onClick={() => void onAction({ action: 'cancel_overtime', overtimeId, expectedVersion }, 'Overtime request cancelled.')}><X className="mr-1.5 h-4 w-4" />Cancel</Button>}
    </div>
  );
}
