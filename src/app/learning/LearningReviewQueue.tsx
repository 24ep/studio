"use client";

import * as React from 'react';
import { CheckCircleIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ReviewSubmission = {
  id: string;
  status?: string;
  text?: string | null;
  file_url?: string | null;
  feedback?: string | null;
  updated_at?: string | null;
  course_title?: string | null;
  employee_name?: string | null;
  block_title?: string | null;
};

export function LearningReviewQueue({ submissions, onRefresh }: { submissions: ReviewSubmission[]; onRefresh: () => Promise<void> | void }) {
  const [feedback, setFeedback] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const decide = async (submission: ReviewSubmission, approved: boolean) => {
    const note = feedback[submission.id]?.trim() || '';
    if (!approved && !note) { setError('Feedback is required when requesting changes.'); return; }
    const expectedUpdatedAt = submission.updated_at ? new Date(submission.updated_at).toISOString() : null;
    if (!expectedUpdatedAt) { setError('This review item is missing its concurrency timestamp. Reload the queue.'); return; }
    setBusyId(submission.id); setError(null);
    try {
      const response = await fetch('/api/learning/studio/actions', {
        method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'review_assignment', submissionId: submission.id, approved, feedback: note || undefined, expectedUpdatedAt }),
      });
      const payload = await response.json() as { message?: string };
      if (response.status === 409) { setError(payload.message || 'This submission changed. The queue has been refreshed.'); await onRefresh(); return; }
      if (!response.ok) throw new Error(payload.message || 'Unable to review assignment.');
      setFeedback(current => ({ ...current, [submission.id]: '' }));
      await onRefresh();
    } catch (reviewError) { setError(reviewError instanceof Error ? reviewError.message : 'Unable to review assignment.'); }
    finally { setBusyId(null); }
  };

  if (!submissions.length) return <div className="rounded-2xl border border-dashed p-10 text-center"><CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-3 font-semibold">Review queue is clear</p><p className="mt-1 text-sm text-muted-foreground">New learner submissions will appear here.</p></div>;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {submissions.map(submission => (
        <article key={submission.id} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><DocumentTextIcon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{submission.course_title || 'Course assignment'}</p><h3 className="mt-1 text-lg font-bold">{submission.block_title || 'Assignment'}</h3><p className="mt-1 text-sm text-muted-foreground">{submission.employee_name || 'Employee'} · Submitted {submission.updated_at ? new Date(submission.updated_at).toLocaleString() : 'recently'}</p></div></div>
              {submission.text && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-6">{submission.text}</div>}
              {submission.file_url && <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline">Open submitted evidence</a>}
            </div>
            <div className="w-full shrink-0 lg:w-80">
              <label className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground" htmlFor={`feedback-${submission.id}`}>Reviewer feedback</label>
              <Textarea id={`feedback-${submission.id}`} className="mt-2 min-h-24" value={feedback[submission.id] || ''} onChange={event => setFeedback(current => ({ ...current, [submission.id]: event.target.value }))} placeholder="Required when requesting changes" />
              <div className="mt-3 flex gap-2"><Button className="flex-1" disabled={busyId === submission.id} onClick={() => decide(submission, true)}><CheckCircleIcon className="mr-2 h-4 w-4" />Approve</Button><Button className="flex-1" variant="outline" disabled={busyId === submission.id} onClick={() => decide(submission, false)}><ExclamationTriangleIcon className="mr-2 h-4 w-4" />Changes</Button></div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
