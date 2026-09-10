"use client";

import * as React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { assignmentViewModel } from './learning-assignment-view-model';

type Submission = {
  id: string;
  block_id: string;
  text?: string | null;
  file_url?: string | null;
  status: string;
  feedback?: string | null;
  updated_at?: string | null;
};

type CourseDetailPayload = {
  enrollment?: { id?: string } | null;
  sections?: Array<{ lessons?: Array<{ blocks?: Array<{ id?: string; title?: string | null; type?: string }> }> }>;
  assignmentSubmissions?: Record<string, Submission>;
};

export function LearningAssignmentBlock({ courseId }: { courseId: string }) {
  const [data, setData] = React.useState<CourseDetailPayload | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/learning/courses/${courseId}`, { credentials: 'include', cache: 'no-store' });
    const payload = await response.json() as { data?: CourseDetailPayload; message?: string };
    if (!response.ok || !payload.data) throw new Error(payload.message || 'Unable to load assignment review status.');
    setData(payload.data);
    setDrafts(current => {
      const next = { ...current };
      Object.values(payload.data?.assignmentSubmissions || {}).forEach(submission => {
        if (next[submission.block_id] === undefined) next[submission.block_id] = submission.text || '';
      });
      return next;
    });
  }, [courseId]);

  React.useEffect(() => {
    load().catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load assignment review status.'));
  }, [load]);

  const blockTitles = React.useMemo(() => {
    const entries: Array<[string, string]> = [];
    for (const section of data?.sections || []) {
      for (const lesson of section.lessons || []) {
        for (const block of lesson.blocks || []) {
          if (block.id && block.type === 'assignment') entries.push([block.id, block.title || 'Assignment']);
        }
      }
    }
    return Object.fromEntries(entries);
  }, [data]);

  const submissions = Object.values(data?.assignmentSubmissions || {});
  if (!submissions.length) return null;

  const resubmit = async (submission: Submission) => {
    const enrollmentId = data?.enrollment?.id;
    if (!enrollmentId) return;
    setSaving(submission.block_id);
    setError(null);
    try {
      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_assignment',
          enrollmentId,
          blockId: submission.block_id,
          text: drafts[submission.block_id] || '',
          fileUrl: submission.file_url || undefined,
        }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to resubmit assignment.');
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to resubmit assignment.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="mx-auto mb-10 mt-4 w-full max-w-6xl px-4 sm:px-6" aria-label="Assignment review status">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500 dark:text-zinc-400">Assignment review</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-.025em] text-slate-950 dark:text-white">Feedback and resubmission</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Reviewer decisions are shown here as soon as they are recorded.</p>
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

        <div className="mt-5 space-y-4">
          {submissions.map(submission => {
            const model = assignmentViewModel(submission);
            const Icon = model.state === 'approved' ? CheckCircleIcon : model.state === 'changes_requested' ? ExclamationTriangleIcon : ClockIcon;
            return (
              <article key={submission.id} className="rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-950 dark:text-white">{blockTitles[submission.block_id] || 'Assignment'}</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-zinc-900 dark:text-zinc-300">{model.label}</span>
                    </div>
                    {model.feedback && (
                      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                        <span className="font-semibold">Reviewer feedback: </span>{model.feedback}
                      </div>
                    )}
                    {model.state === 'changes_requested' && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          aria-label={`Resubmission for ${blockTitles[submission.block_id] || 'assignment'}`}
                          value={drafts[submission.block_id] || ''}
                          onChange={event => setDrafts(current => ({ ...current, [submission.block_id]: event.target.value }))}
                          className="min-h-28"
                        />
                        <Button onClick={() => resubmit(submission)} disabled={saving === submission.block_id}>
                          {saving === submission.block_id ? 'Resubmitting…' : model.actionLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
