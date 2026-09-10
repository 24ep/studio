'use client';

import * as React from 'react';

import type { HrisTask, HrisTaskPage } from '@/lib/hris/workspace-contracts';
import { HrisApprovalInbox, type HrisApprovalDecision, type HrisApprovalTask } from './HrisApprovalInbox';

const decisionMap = {
  approve: 'approve',
  reject: 'reject',
  return_for_revision: 'request_changes',
} as const;

export function HrisUnifiedTaskInbox({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [tasks, setTasks] = React.useState<HrisTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/hr/workspace/tasks?status=pending,pending_approval,under_review&priority=critical,high,normal,low&pageSize=100', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json() as { data?: HrisTaskPage };
      const records = payload.data?.records || [];
      setTasks(records);
      onCountChange?.(records.length);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  React.useEffect(() => { void load(); }, [load]);

  if (loading || !tasks.length) return null;

  const approvalTasks = tasks.map(toApprovalTask);
  const decide = async (approval: HrisApprovalTask, decision: HrisApprovalDecision, comment: string) => {
    const task = approval.source as HrisTask;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/hr/workspace/tasks/${task.id}/decisions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decisionMap[decision], comment: comment || null, expectedVersion: task.version }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'The task decision could not be completed.');
      setMessage('Task updated.');
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'The task decision could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <div><h3 className="text-sm font-semibold">Cross-domain tasks</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Projected work from HRIS domains; each decision is applied by its authoritative workflow.</p></div>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      <HrisApprovalInbox tasks={approvalTasks} submitting={submitting} onDecision={decide} />
    </div>
  );
}

function toApprovalTask(task: HrisTask): HrisApprovalTask {
  const allowed: HrisApprovalDecision[] = [];
  if (task.allowedDecisions.includes('approve')) allowed.push('approve');
  if (task.allowedDecisions.includes('request_changes')) allowed.push('return_for_revision');
  if (task.allowedDecisions.includes('reject')) allowed.push('reject');
  return {
    id: task.id,
    type: task.taskType.replaceAll('_', ' '),
    title: task.subject,
    meta: [task.requester?.name, task.companyName, dueText(task.dueAt)].filter(Boolean).join(' · '),
    status: task.status,
    summary: <div><p>{task.summary || 'Open the source record for complete context.'}</p><a className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline" href={task.deepLink}>Open source record</a></div>,
    source: task,
    allowedDecisions: allowed,
  };
}

function dueText(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `Due ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)}`;
}
