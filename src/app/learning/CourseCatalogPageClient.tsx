"use client";

import * as React from 'react';
import { MagnifyingGlassIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCatalog, type CatalogCourse } from './CourseCatalog';
import { CourseCreateDialog } from './CourseCreateDialog';
import { LearningAssignmentDialog } from './LearningAssignmentDialog';
import { AiLearningBuilderDialog } from './AiLearningBuilderDialog';

interface CatalogResponse {
  data?: CatalogCourse[];
  capabilities?: { canManageLearning?: boolean };
  message?: string;
}

export function CourseCatalogPageClient() {
  const [courses, setCourses] = React.useState<CatalogCourse[]>([]);
  const [canManage, setCanManage] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [assignCourse, setAssignCourse] = React.useState<CatalogCourse | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/learning/catalog', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(payload.message || 'Unable to load course catalog.');
      setCourses(payload.data || []);
      setCanManage(Boolean(payload.capabilities?.canManageLearning));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load course catalog.');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const categories = React.useMemo(() => ['all', ...Array.from(new Set(courses.map(course => course.category).filter((value): value is string => Boolean(value)))).sort()], [courses]);
  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter(course => (category === 'all' || course.category === category) && (!needle || [course.title, course.category, course.description].filter(Boolean).join(' ').toLowerCase().includes(needle)));
  }, [courses, query, category]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">Learning · Courses</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] text-slate-950 dark:text-white sm:text-4xl">Learn what moves your work forward.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">Browse published learning, continue your assigned courses, and see required learning without management clutter.</p></div>
        {canManage && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setAiOpen(true)}><SparklesIcon className="mr-2 h-4 w-4" />Build with AI</Button><Button onClick={() => setCreateOpen(true)}><PlusIcon className="mr-2 h-4 w-4" />Create course</Button></div>}
      </header>

      <div className="my-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search courses" className="pl-9" /></div>
        <select value={category} onChange={event => setCategory(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All categories</option>{categories.filter(item => item !== 'all').map(item => <option key={item} value={item}>{item}</option>)}</select>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-zinc-900" />)}</div> : <CourseCatalog courses={filtered} canManage={canManage} onAssign={setAssignCourse} />}

      {canManage && <CourseCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />}
      {canManage && <AiLearningBuilderDialog open={aiOpen} onOpenChange={setAiOpen} initialType="course" onCreated={load} />}
      {canManage && assignCourse && <LearningAssignmentDialog open={Boolean(assignCourse)} onOpenChange={open => { if (!open) setAssignCourse(null); }} courseIds={[assignCourse.id]} sourceType="course" sourceId={assignCourse.id} sourceLabel={assignCourse.title} onAssigned={load} />}
    </main>
  );
}
