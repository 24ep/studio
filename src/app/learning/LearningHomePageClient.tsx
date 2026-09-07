"use client";

import * as React from 'react';
import Link from 'next/link';
import { AcademicCapIcon, ArrowRightIcon, CheckBadgeIcon, ClockIcon, MapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

type Enrollment = { id: string; courseId: string; courseTitle: string; status: string; progress: number; dueDate: string | null };
type PathItem = { id: string; title: string; progress: number; totalCourseCount: number; completedCourseCount: number };
type CatalogCourse = { id: string; title: string; category: string | null; isRequired: boolean; enrollmentId: string | null; status: string | null; progress: number; dueDate: string | null };
type MeResponse = { data?: { available: boolean; enrollments: Enrollment[]; paths: PathItem[]; certificates: unknown[] }; capabilities?: { canViewLearningManagement?: boolean }; message?: string };
type CatalogResponse = { data?: CatalogCourse[] };

function dueLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value); if (Number.isNaN(date.getTime())) return value;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `Due in ${days}d`;
}

export function LearningHomePageClient() {
  const [me, setMe] = React.useState<MeResponse['data'] | null>(null);
  const [catalog, setCatalog] = React.useState<CatalogCourse[]>([]);
  const [canManage, setCanManage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const [meResponse, catalogResponse] = await Promise.all([fetch('/api/learning/me', { credentials: 'include', cache: 'no-store' }), fetch('/api/learning/catalog', { credentials: 'include', cache: 'no-store' })]);
        const mePayload = await meResponse.json() as MeResponse; const catalogPayload = await catalogResponse.json() as CatalogResponse;
        if (!meResponse.ok) throw new Error(mePayload.message || 'Unable to load your learning.');
        setMe(mePayload.data || null); setCanManage(Boolean(mePayload.capabilities?.canViewLearningManagement)); setCatalog(catalogPayload.data || []);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load your learning.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const continueCourses = catalog.filter(course => course.status === 'in_progress').sort((a,b) => b.progress - a.progress).slice(0, 4);
  const required = catalog.filter(course => course.isRequired && course.status !== 'completed').sort((a,b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))).slice(0, 4);
  const available = catalog.filter(course => !course.enrollmentId).slice(0, 4);

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="h-40 animate-pulse rounded-3xl bg-muted" /><div className="mt-6 grid gap-4 md:grid-cols-3">{[0,1,2].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}</div></main>;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#173f37] p-6 text-[#f4f7ef] sm:p-8"><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[#d9ef95]/20" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#c6d8cb]">My Learning</p><h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-.04em] sm:text-5xl">Keep momentum on the skills that matter.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d7e2da]">Continue assigned learning, see what is due, and explore your next course without crossing into HR-only data.</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild className="bg-[#d9ef95] text-[#173f37] hover:bg-[#cce67d]"><Link href="/learning/courses">Browse courses<ArrowRightIcon className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/learning/paths">My paths</Link></Button>{canManage && <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/learning/manage">Learning management</Link></Button>}</div></div></section>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {me && !me.available && <div className="mt-6 rounded-2xl border border-dashed p-8"><h2 className="font-bold">Employee profile not linked</h2><p className="mt-2 text-sm text-muted-foreground">Learning self-service becomes available when your user account is linked to an employee profile.</p></div>}

      <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700 dark:text-blue-300">Continue</p><h2 className="text-2xl font-bold tracking-[-.03em]">Pick up where you left off</h2></div><Link className="text-sm font-semibold text-blue-700" href="/learning/courses">All courses</Link></div>{continueCourses.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{continueCourses.map(course => <Link key={course.id} href={`/learning/courses/${course.id}`} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5"><AcademicCapIcon className="h-6 w-6 text-blue-600" /><h3 className="mt-4 font-bold">{course.title}</h3><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600" style={{ width: `${course.progress}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{course.progress}% complete</p></Link>)}</div> : <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No courses in progress. Browse the catalog when you’re ready to start.</p>}</section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2"><section><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-amber-700 dark:text-amber-300">Required & due soon</p><h2 className="text-2xl font-bold tracking-[-.03em]">What needs your attention</h2></div><div className="space-y-3">{required.length ? required.map(course => <Link key={course.id} href={`/learning/courses/${course.id}`} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4"><div><p className="font-semibold">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.category || 'Required learning'}</p></div><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"><ClockIcon className="h-4 w-4" />{dueLabel(course.dueDate) || 'Required'}</span></Link>) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nothing required is outstanding.</p>}</div></section><section><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700 dark:text-violet-300">Paths</p><h2 className="text-2xl font-bold tracking-[-.03em]">Your structured journeys</h2></div><div className="space-y-3">{(me?.paths || []).slice(0,4).map(path => <Link key={path.id} href="/learning/paths" className="flex items-center gap-4 rounded-xl border bg-card p-4"><MapIcon className="h-6 w-6 text-violet-600" /><div className="min-w-0 flex-1"><p className="font-semibold">{path.title}</p><p className="mt-1 text-xs text-muted-foreground">{path.completedCourseCount}/{path.totalCourseCount} courses · {path.progress}%</p></div></Link>)}{!(me?.paths || []).length && <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No paths assigned yet.</p>}</div></section></div>

      <section className="mt-8"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-300">Explore</p><h2 className="text-2xl font-bold tracking-[-.03em]">Available learning</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{available.map(course => <Link key={course.id} href={`/learning/courses/${course.id}`} className="rounded-2xl border bg-card p-4"><AcademicCapIcon className="h-5 w-5 text-emerald-600" /><p className="mt-3 font-semibold">{course.title}</p><p className="mt-1 text-xs text-muted-foreground">{course.category || 'Learning'}</p></Link>)}</div></section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2"><Link href="/learning/achievements" className="flex items-center gap-4 rounded-2xl border bg-card p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><TrophyIcon className="h-6 w-6" /></span><div><p className="font-bold">Achievements</p><p className="text-sm text-muted-foreground">See earned badges and milestones.</p></div></Link><Link href="/learning/certificates" className="flex items-center gap-4 rounded-2xl border bg-card p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckBadgeIcon className="h-6 w-6" /></span><div><p className="font-bold">Credentials</p><p className="text-sm text-muted-foreground">View your employee certificates.</p></div></Link></section>
    </main>
  );
}
