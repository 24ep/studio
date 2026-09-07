"use client";

import Link from 'next/link';
import { BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export interface CatalogCourse {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  durationHours: number | null;
  isRequired: boolean;
  enrollmentId: string | null;
  status: string | null;
  progress: number;
  dueDate: string | null;
}

export function CourseCatalog({ courses, canManage, onAssign }: { courses: CatalogCourse[]; canManage: boolean; onAssign: (course: CatalogCourse) => void }) {
  if (!courses.length) return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">No published courses match your filters.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {courses.map(course => {
        const action = course.status === 'in_progress' ? 'Continue' : course.status === 'completed' ? 'Review' : course.enrollmentId ? 'Start' : 'View';
        return (
          <article key={course.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><BookOpenIcon className="h-5 w-5" /></span>
              {course.isRequired && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Required</span>}
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.13em] text-slate-500 dark:text-zinc-400">{course.category || 'Learning'}</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-.025em] text-slate-950 dark:text-white">{course.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-zinc-400">{course.description || 'Open the course to see its learning objectives and curriculum.'}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
              {course.durationHours != null && <span className="inline-flex items-center gap-1"><ClockIcon className="h-4 w-4" />{course.durationHours}h</span>}
              {course.enrollmentId && <span>{Math.max(0, Math.min(100, course.progress))}% complete</span>}
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button asChild><Link href={`/learning/courses/${course.id}`}>{action}</Link></Button>
              {canManage && <Button variant="outline" onClick={() => onAssign(course)}>Assign</Button>}
              {canManage && <Button asChild variant="ghost"><Link href={`/learning/courses/${course.id}/studio`}>Studio</Link></Button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
