"use client";

import { MapIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export interface LearningPathItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  courseIds: string[];
  progress?: number;
  assignedCourseCount?: number;
  completedCourseCount?: number;
}

export function LearningPathsView({ paths, canManage, onEdit, onAssign }: { paths: LearningPathItem[]; canManage: boolean; onEdit: (path: LearningPathItem) => void; onAssign: (path: LearningPathItem) => void }) {
  if (!paths.length) return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No learning paths are available yet.</div>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {paths.map(path => (
        <article key={path.id} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><MapIcon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold tracking-[-.025em]">{path.title}</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">{path.status.replaceAll('_', ' ')}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{path.description || 'A structured sequence of courses.'}</p></div></div>
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-3 text-center"><div><p className="text-lg font-bold">{path.courseIds.length}</p><p className="text-xs text-muted-foreground">Courses</p></div><div><p className="text-lg font-bold">{path.assignedCourseCount ?? 0}</p><p className="text-xs text-muted-foreground">Assigned</p></div><div><p className="text-lg font-bold">{path.progress ?? 0}%</p><p className="text-xs text-muted-foreground">Complete</p></div></div>
          {canManage && <div className="mt-4 flex gap-2"><Button onClick={() => onAssign(path)}>Assign path</Button><Button variant="outline" onClick={() => onEdit(path)}>Edit</Button></div>}
        </article>
      ))}
    </div>
  );
}
