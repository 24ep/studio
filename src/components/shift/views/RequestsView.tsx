"use client";

import * as React from 'react';
import {
  Check,
  RefreshCw,
  Send,
  Undo2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  EmptyState,
  ErrorState,
  KeyValueList,
  LoadingState,
  PermissionBanner,
  PolicyWarnings,
  ShiftPageHeader,
  ShiftStatusBadge,
} from '../ShiftShared';
import {
  arrayValue,
  employeeName,
  formatDate,
  formatTime,
  numberValue,
  stringValue,
  type ShiftRecord,
} from '../shift-types';
import { useShiftAttendance } from '../use-shift-attendance';
import { AttendanceRequestsReview } from './AttendanceRequestsReview';
import { AttendanceCorrectionRequestForm } from './AttendanceCorrectionRequestForm';
import { ShiftRequestComposer } from './ShiftRequestComposer';
import { AttendanceCorrectionOwnerActions, ShiftRequestOwnerActions } from './TimeRequestOwnerActions';

export function RequestsView({
  mode,
  employeeSelfService = false,
}: {
  mode: 'shift' | 'attendance';
  employeeSelfService?: boolean;
}) {
  const query = React.useMemo(() => new URLSearchParams(employeeSelfService ? { scope: 'self' } : {}), [employeeSelfService]);
  const state = useShiftAttendance('requests', query);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [editingRequest, setEditingRequest] = React.useState<ShiftRecord | null>(null);

  const designPreview = process.env.NODE_ENV !== 'production'
    && typeof window !== 'undefined'
    && window.location.hash === '#design-preview';

  if (designPreview && mode === 'attendance' && !employeeSelfService) {
    return (
      <AttendanceRequestsReview
        requests={[]}
        capabilities={{
          canViewWorkforce: true,
          canManageWorkforce: true,
          canViewPayroll: false,
          canManagePayroll: false,
          canSubmitOwnRecords: true,
          canApproveTeamRecords: true,
          dataScope: 'manager',
        }}
        refreshing={false}
        saving={false}
        error={null}
        onRefresh={() => undefined}
        onDecision={async () => ({ ok: true })}
      />
    );
  }

  if (state.loading) return <Workspace><LoadingState label={`Loading ${mode} requests and approval history…`} /></Workspace>;
  if (state.error && !state.data) return <Workspace><ErrorState message={state.error} onRetry={state.reload} /></Workspace>;
  if (!state.data || !state.capabilities) return null;

  const requests = mode === 'shift' ? arrayValue(state.data.shiftRequests) : arrayValue(state.data.attendanceRequests);
  const assignments = arrayValue(state.data.assignments);
  const colleagues = arrayValue(state.data.colleagues);
  const eligibleAssignments = arrayValue(state.data.eligibleSwapAssignments);
  const openShifts = arrayValue(state.data.openShifts);
  const headerActions = <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { setEditingRequest(null); setRequestDialogOpen(true); }}><Send className="mr-2 h-4 w-4" />{mode === 'shift' ? 'New shift request' : 'Request correction'}</Button><Button variant="outline" size="sm" onClick={() => state.reload()} disabled={state.refreshing}><RefreshCw className={cn('mr-2 h-4 w-4', state.refreshing && 'animate-spin')} />Refresh</Button></div>;

  if (mode === 'attendance' && !employeeSelfService) {
    return (
      <AttendanceRequestsReview
        requests={requests}
        capabilities={state.capabilities}
        refreshing={state.refreshing}
        saving={state.saving}
        error={state.error}
        onRefresh={state.reload}
        onDecision={(body, message) => state.mutate(body, message, { url: '/api/ess/requests', method: 'PATCH' })}
      />
    );
  }

  return (
    <Workspace>
      {employeeSelfService ? (
        <div className="flex justify-end" aria-label="Request actions">{headerActions}</div>
      ) : (
        <ShiftPageHeader
          eyebrow={`Shift · ${mode === 'shift' ? 'Shift Request' : 'Attendance Request'}`}
          title={mode === 'shift' ? 'Shift requests' : 'Attendance corrections'}
          description={mode === 'shift'
            ? 'Request a schedule change or swap without altering the published roster before all required approvals complete.'
            : 'Compare recorded and requested time, add evidence context, and route the correction to the authoritative attendance record.'}
          actions={headerActions}
        />
      )}
      <PermissionBanner scope={state.capabilities.dataScope} />
      {state.error && <InlineError message={state.error} />}

      <div>
        <RequestHistory
          mode={mode}
          requests={requests}
          canApprove={!employeeSelfService && state.capabilities.canApproveTeamRecords}
          saving={state.saving}
          employeeSelfService={employeeSelfService}
          onEdit={request => { setEditingRequest(request); setRequestDialogOpen(true); }}
          onDecision={(body, message) => mode === 'attendance'
            ? state.mutate(body, message, { url: '/api/ess/requests', method: 'PATCH' })
            : state.mutate(body, message)}
        />
      </div>

      <Dialog open={requestDialogOpen} onOpenChange={open => { setRequestDialogOpen(open); if (!open) setEditingRequest(null); }}>
        <DialogContent className="max-h-[92dvh] max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{mode === 'shift' ? 'New shift request' : 'Request attendance correction'}</DialogTitle>
            <DialogDescription>{mode === 'shift' ? 'Create and submit a shift request.' : 'Create and submit an attendance correction.'}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            {mode === 'shift' ? (
              <ShiftRequestComposer assignments={assignments} eligibleAssignments={eligibleAssignments} openShifts={openShifts} colleagues={colleagues} initialRequest={editingRequest} saving={state.saving} onSave={async body => { const editing = body.action === 'update_shift_request'; const result = await state.mutate(body, editing ? 'Shift request changes saved.' : body.saveAsDraft ? 'Shift request draft saved.' : 'Shift request submitted.'); if (result) setRequestDialogOpen(false); return result; }} />
            ) : (
              <AttendanceCorrectionRequestForm initialRequest={editingRequest} saving={state.saving} onSave={async body => { const editing = Boolean(editingRequest?.id); const result = await state.mutate(body, editing ? 'Attendance correction changes saved.' : body.saveAsDraft ? 'Attendance correction draft saved.' : 'Attendance correction submitted.', { url: '/api/ess/requests', method: editing ? 'PUT' : 'POST' }); if (result) setRequestDialogOpen(false); return result; }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Workspace>
  );
}

function Workspace({ children }: { children: React.ReactNode }) {
  return <main className="min-h-full w-full bg-transparent px-3 py-4 text-slate-950 sm:px-5 lg:px-7 dark:text-zinc-100"><div className="flex w-full max-w-none flex-col gap-4">{children}</div></main>;
}

function InlineError({ message }: { message: string }) {
  return <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">{message}</div>;
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800"><h2 className="font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RequestHistory({
  mode,
  requests,
  canApprove,
  saving,
  employeeSelfService,
  onEdit,
  onDecision,
}: {
  mode: 'shift' | 'attendance';
  requests: ShiftRecord[];
  canApprove: boolean;
  saving: boolean;
  employeeSelfService: boolean;
  onEdit: (request: ShiftRecord) => void;
  onDecision: (body: Record<string, unknown>, message: string) => Promise<unknown>;
}) {
  const [comments, setComments] = React.useState<Record<string, string>>({});
  return (
    <Panel title={`${mode === 'shift' ? 'Shift' : 'Correction'} request history`} description={`${requests.length} visible request${requests.length === 1 ? '' : 's'} in your authorized scope.`}>
      {requests.length === 0 ? <EmptyState title="No requests yet" description={`Submitted ${mode} requests and their approval history will appear here.`} /> : (
        <div className="space-y-3">
          {requests.map(request => {
            const id = String(request.id);
            const status = stringValue(request.status);
            const values = request.requested_values && typeof request.requested_values === 'object' ? request.requested_values as Record<string, unknown> : {};
            const pending = status === 'pending_approval';
            return (
              <article key={id} className="rounded-md border border-slate-200 p-4 dark:border-zinc-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{stringValue(request.request_id)}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{mode === 'shift' ? stringValue(request.request_type).replace(/_/g, ' ') : stringValue(request.title)}</p>
                    {Boolean(request.first_name || request.preferred_name) && <p className="mt-1 text-xs text-slate-500">{employeeName(request)} · {formatDate(request.created_at)}</p>}
                  </div>
                  <ShiftStatusBadge status={status} />
                </div>
                <div className="mt-3">
                  <KeyValueList rows={mode === 'shift' ? [
                    ['Effective period', `${formatDate(request.effective_start)}–${formatDate(request.effective_end)}`],
                    ['Swap colleague', request.swap_first_name ? `${request.swap_first_name} ${request.swap_last_name || ''}` : '—'],
                    ['Work location', stringValue(request.work_location)],
                    ['Reason', stringValue(request.reason)],
                  ] : [
                    ['Attendance date', formatDate(values.workDate)],
                    ['Requested time', `${formatTime(values.clockIn)}–${formatTime(values.clockOut)}`],
                    ['Break', `${numberValue(values.breakMinutes)}m`],
                    ['Reason', stringValue(request.reason)],
                  ]} />
                </div>
                <PolicyWarnings warnings={request.policy_warnings} />
                {employeeSelfService && mode === 'shift' && <ShiftRequestOwnerActions request={request} saving={saving} onEdit={onEdit} onAction={onDecision} />}
                {employeeSelfService && mode === 'attendance' && <AttendanceCorrectionOwnerActions request={request} saving={saving} onEdit={onEdit} onAction={onDecision} />}
                {mode === 'shift' && status === 'awaiting_employee' && (
                  <Button className="mt-3" size="sm" disabled={saving} onClick={() => void onDecision({ action: 'decide_shift_request', requestId: id, decision: 'accept_swap', expectedVersion: numberValue(request.version) }, 'Shift swap accepted and sent for manager approval.')}><Check className="mr-2 h-4 w-4" />Accept swap</Button>
                )}
                {mode === 'shift' && canApprove && pending && (
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-zinc-800">
                    <Textarea value={comments[id] || ''} onChange={event => setComments(value => ({ ...value, [id]: event.target.value }))} placeholder="Reviewer comment (required to reject or return)" className="min-h-16" />
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" disabled={saving || !(comments[id] || '').trim()} onClick={() => void onDecision({ action: 'decide_shift_request', requestId: id, decision: 'return_for_revision', comment: comments[id], expectedVersion: numberValue(request.version) }, 'Shift request returned for revision.')}><Undo2 className="mr-1.5 h-4 w-4" />Return</Button>
                      <Button variant="outline" size="sm" disabled={saving || !(comments[id] || '').trim()} onClick={() => void onDecision({ action: 'decide_shift_request', requestId: id, decision: 'reject', comment: comments[id], expectedVersion: numberValue(request.version) }, 'Shift request rejected.')}><X className="mr-1.5 h-4 w-4" />Reject</Button>
                      <Button size="sm" disabled={saving} onClick={() => void onDecision({ action: 'decide_shift_request', requestId: id, decision: 'approve', comment: comments[id] || null, expectedVersion: numberValue(request.version) }, 'Shift request approved and applied to the roster.')}><Check className="mr-1.5 h-4 w-4" />Approve</Button>
                    </div>
                  </div>
                )}
                {Array.isArray(request.activity) && request.activity.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-zinc-800">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Activity</p>
                    <ol className="mt-2 space-y-2">{(request.activity as ShiftRecord[]).map((activity, index) => <li key={String(activity.id || index)} className="flex items-start justify-between gap-4 text-xs"><span><strong>{stringValue(activity.action).replace(/_/g, ' ')}</strong>{activity.comment ? ` · ${activity.comment}` : ''}</span><span className="shrink-0 text-slate-500">{formatDate(activity.createdAt)}</span></li>)}</ol>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

