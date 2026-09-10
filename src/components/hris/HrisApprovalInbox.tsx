"use client";

import * as React from 'react';
import { Check, RotateCcw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HrisEmptyState, HrisStatusBadge } from './HrisWorkspacePrimitives';

export type HrisApprovalDecision = 'approve' | 'reject' | 'return_for_revision';

export interface HrisApprovalTask {
  id: string;
  type: string;
  title: string;
  meta: string;
  status: unknown;
  summary: React.ReactNode;
  reason?: string | null;
  source?: unknown;
  allowedDecisions?: HrisApprovalDecision[];
}

export function hrisApprovalTaskMatches(task: Pick<HrisApprovalTask, 'title' | 'meta' | 'type'>, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [task.title, task.meta, task.type].join(' ').toLowerCase().includes(normalized);
}

export function HrisApprovalInbox({
  tasks,
  submitting,
  onDecision,
}: {
  tasks: HrisApprovalTask[];
  submitting: boolean;
  onDecision: (task: HrisApprovalTask, decision: HrisApprovalDecision, comment: string) => Promise<unknown>;
}) {
  const [query, setQuery] = React.useState('');
  const [type, setType] = React.useState('all');
  const types = React.useMemo(() => Array.from(new Set(tasks.map(task => task.type))).sort(), [tasks]);
  const filtered = tasks.filter(task => (
    (type === 'all' || task.type === type)
    && hrisApprovalTaskMatches(task, query)
  ));

  if (!tasks.length) {
    return <HrisEmptyState title="Inbox clear" description="No employee requests are waiting for your decision." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row" role="search" aria-label="Filter approvals">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search employee or request"
            aria-label="Search approvals"
          />
        </div>
        {types.length > 1 && (
          <select
            value={type}
            onChange={event => setType(event.target.value)}
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter approval type"
          >
            <option value="all">All request types</option>
            {types.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        )}
      </div>

      {filtered.length ? (
        <div className="grid gap-3">
          {filtered.map(task => (
            <HrisApprovalTaskCard
              key={task.id}
              task={task}
              submitting={submitting}
              onDecision={onDecision}
            />
          ))}
        </div>
      ) : (
        <HrisEmptyState
          title="No approvals match"
          description="Adjust the search or request-type filter to see more approvals."
        />
      )}
    </div>
  );
}

function HrisApprovalTaskCard({
  task,
  submitting,
  onDecision,
}: {
  task: HrisApprovalTask;
  submitting: boolean;
  onDecision: (task: HrisApprovalTask, decision: HrisApprovalDecision, comment: string) => Promise<unknown>;
}) {
  const [comment, setComment] = React.useState('');
  const allowed = task.allowedDecisions || ['approve', 'return_for_revision', 'reject'];
  const decide = async (decision: HrisApprovalDecision) => {
    await onDecision(task, decision, comment.trim());
    setComment('');
  };

  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{task.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{task.meta}</p>
        </div>
        <HrisStatusBadge value={task.status} />
      </div>

      <div className="mt-4 rounded-md bg-muted/35 p-3 text-sm">
        {task.summary}
        {task.reason && <p className="mt-2 text-muted-foreground">{task.reason}</p>}
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor={'approval-comment-' + task.id}>Decision comment</Label>
        <Textarea
          id={'approval-comment-' + task.id}
          value={comment}
          onChange={event => setComment(event.target.value)}
          className="min-h-16"
          placeholder="Required when returning or rejecting"
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {allowed.includes('approve') && <Button disabled={submitting} onClick={() => void decide('approve')}>
          <Check className="h-4 w-4" aria-hidden />
          Approve
        </Button>}
        {allowed.includes('return_for_revision') && <Button variant="outline" disabled={submitting || !comment.trim()} onClick={() => void decide('return_for_revision')}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Return for revision
        </Button>}
        {allowed.includes('reject') && <Button variant="outline" disabled={submitting || !comment.trim()} onClick={() => void decide('reject')}>
          <X className="h-4 w-4" aria-hidden />
          Reject
        </Button>}
      </div>
    </article>
  );
}
