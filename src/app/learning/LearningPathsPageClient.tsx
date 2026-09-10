"use client";

import * as React from 'react';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { LearningPathsView, type LearningPathItem } from './LearningPathsView';
import { LearningPathDialog } from './LearningPathDialog';
import { LearningAssignmentDialog } from './LearningAssignmentDialog';
import { AiLearningBuilderDialog } from './AiLearningBuilderDialog';
import type { CatalogCourse } from './CourseCatalog';

type SelfResponse = { data?: { paths?: LearningPathItem[] }; capabilities?: { canManageLearning?: boolean }; message?: string };
type CatalogResponse = { data?: CatalogCourse[] };

type GenericRecord = Record<string, unknown> & { id?: string };
function records(payload: unknown): GenericRecord[] {
  const value = payload as { resource?: { records?: GenericRecord[] }; records?: GenericRecord[] };
  return value?.resource?.records || value?.records || [];
}
function stringArray(value: unknown) { return Array.isArray(value) ? value.map(String) : []; }
function normalizePath(row: GenericRecord): LearningPathItem {
  return { id: String(row.id || ''), title: String(row.title || ''), description: row.description == null ? null : String(row.description), status: String(row.status || 'draft'), courseIds: stringArray(row.courseIds ?? row.course_ids) };
}

export function LearningPathsPageClient() {
  const [paths, setPaths] = React.useState<LearningPathItem[]>([]);
  const [courses, setCourses] = React.useState<CatalogCourse[]>([]);
  const [canManage, setCanManage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<LearningPathItem | null | undefined>(undefined);
  const [assigning, setAssigning] = React.useState<LearningPathItem | null>(null);
  const [aiOpen, setAiOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [selfResponse, catalogResponse] = await Promise.all([
        fetch('/api/learning/me', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/learning/catalog', { credentials: 'include', cache: 'no-store' }),
      ]);
      const self = await selfResponse.json() as SelfResponse;
      const catalog = await catalogResponse.json() as CatalogResponse;
      if (!selfResponse.ok) throw new Error(self.message || 'Unable to load learning paths.');
      const manage = Boolean(self.capabilities?.canManageLearning);
      setCanManage(manage); setCourses(catalog.data || []);
      const ownPaths = self.data?.paths || [];
      if (!manage) { setPaths(ownPaths); return; }
      const managementResponse = await fetch('/api/hr/learning?view=paths', { credentials: 'include', cache: 'no-store' });
      const managementPayload = await managementResponse.json();
      if (!managementResponse.ok) throw new Error('Unable to load managed learning paths.');
      const ownById = new Map(ownPaths.map(path => [path.id, path]));
      setPaths(records(managementPayload).map(normalizePath).map(path => ({ ...path, progress: ownById.get(path.id)?.progress ?? 0, assignedCourseCount: ownById.get(path.id)?.assignedCourseCount ?? 0, completedCourseCount: ownById.get(path.id)?.completedCourseCount ?? 0 })));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load learning paths.'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Learning · Paths</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Structured journeys, clear progress.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Follow assigned paths course by course. Learning teams can design and assign a whole path as one reliable action.</p></div>{canManage && <div className="flex gap-2"><Button variant="outline" onClick={() => setAiOpen(true)}><SparklesIcon className="mr-2 h-4 w-4" />Build with AI</Button><Button onClick={() => setEditing(null)}><PlusIcon className="mr-2 h-4 w-4" />Create path</Button></div>}</header>
      {error && <p role="alert" className="my-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <div className="mt-6">{loading ? <div className="grid gap-4 lg:grid-cols-2">{[0,1,2,3].map(item => <div key={item} className="h-56 animate-pulse rounded-2xl bg-muted" />)}</div> : <LearningPathsView paths={paths} canManage={canManage} onEdit={path => setEditing(path)} onAssign={setAssigning} />}</div>
      {canManage && editing !== undefined && <LearningPathDialog open onOpenChange={open => { if (!open) setEditing(undefined); }} courses={courses} path={editing} onSaved={load} />}
      {canManage && assigning && <LearningAssignmentDialog open courseIds={assigning.courseIds} sourceType="path" sourceId={assigning.id} sourceLabel={assigning.title} onOpenChange={open => { if (!open) setAssigning(null); }} onAssigned={load} />}
      {canManage && <AiLearningBuilderDialog open={aiOpen} onOpenChange={setAiOpen} initialType="path" onCreated={load} />}
    </main>
  );
}
