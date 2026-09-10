"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import * as React from 'react';
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  BellIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  MapIcon,
  MagnifyingGlassIcon,
  PresentationChartLineIcon,
  ScaleIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CareerExplorerPayload, CareerRole, ExplorerMode, RoleId } from './career-explorer-types';

const roleIcons = [ChartBarIcon, BriefcaseIcon, PresentationChartLineIcon];

export function CareerExplorer() {
  const { data: session } = useSession();
  const [mode, setMode] = React.useState<ExplorerMode>('map');
  const [roles, setRoles] = React.useState<CareerRole[]>([]);
  const [currentRole, setCurrentRole] = React.useState('Your current role');
  const [selectedRoleId, setSelectedRoleId] = React.useState<RoleId>('');
  const [goalRoleId, setGoalRoleId] = React.useState<RoleId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingGoal, setIsSavingGoal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [unlinked, setUnlinked] = React.useState(false);
  const selectedRole = roles.find(role => role.id === selectedRoleId) ?? roles[0];

  const loadExplorer = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/learning/career-explorer', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json() as CareerExplorerPayload & { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to load career paths.');
      if (payload.state === 'unlinked' || !payload.data) {
        setUnlinked(true);
        setRoles([]);
        return;
      }
      setUnlinked(false);
      setCurrentRole(payload.data.employee.jobTitle || 'Current employee role');
      const nextRoles = payload.data.roles.map((role, index) => ({
        ...role,
        icon: roleIcons[index % roleIcons.length],
        tone: index === 1 ? 'indigo' as const : 'teal' as const,
      }));
      setRoles(nextRoles);
      const savedRoleTitle = payload.data.goal?.title.replace(/^Career goal:\s*/i, '');
      const savedRole = nextRoles.find(role => role.title === savedRoleTitle);
      setGoalRoleId(savedRole?.id || null);
      setSelectedRoleId(current => nextRoles.some(role => role.id === current) ? current : (savedRole?.id || nextRoles[0]?.id || ''));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load career paths.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadExplorer(); }, [loadExplorer]);

  const chooseGoal = async () => {
    if (!selectedRole) return;
    setIsSavingGoal(true);
    setError(null);
    try {
      const response = await fetch('/api/learning/career-explorer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: selectedRole.id, readiness: selectedRole.readiness }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save career goal.');
      setGoalRoleId(selectedRole.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save career goal.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  React.useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    const keepReferenceTheme = () => {
      if (root.classList.contains('dark')) root.classList.remove('dark');
    };
    keepReferenceTheme();
    const observer = new MutationObserver(keepReferenceTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      if (wasDark) root.classList.add('dark');
    };
  }, []);

  return (
    <div data-no-localize className="min-h-full bg-[#fbfaf6] text-[#101827]">
      {!session?.user?.id && <CareerExplorerPreviewShell />}
      {isLoading ? (
        <CareerExplorerState title="Building your career map" detail="Comparing your employee profile, completed learning, verified credentials, and open positions." />
      ) : error ? (
        <CareerExplorerState title="Career paths are unavailable" detail={error} action="Try again" onAction={() => void loadExplorer()} />
      ) : unlinked ? (
        <CareerExplorerState title="Link your employee profile" detail="Career Explorer needs a linked employee record so it can use your role, skills, learning history, and credentials." action="Open employee self-service" href="/employee-self-service" />
      ) : !selectedRole ? (
        <CareerExplorerState title="No career destinations found" detail="There are no open positions available to compare right now. Add or open positions in Hiring, then return here." action="View positions" href="/positions" />
      ) : mode === 'map' ? (
        <CareerMap
          roles={roles}
          currentRole={currentRole}
          selectedRole={selectedRole}
          onSelect={setSelectedRoleId}
          onCompare={() => setMode('compare')}
          goalRoleId={goalRoleId}
          onChooseGoal={() => void chooseGoal()}
          isSavingGoal={isSavingGoal}
        />
      ) : (
        <CareerComparison
          roles={roles}
          currentRole={currentRole}
          selectedRole={selectedRole}
          onSelect={setSelectedRoleId}
          goalRoleId={goalRoleId}
          onChooseGoal={() => void chooseGoal()}
          isSavingGoal={isSavingGoal}
        />
      )}
    </div>
  );
}

function CareerExplorerState({ title, detail, action, onAction, href }: { title: string; detail: string; action?: string; onAction?: () => void; href?: string }) {
  return <section className="grid min-h-[calc(100vh-7.25rem)] place-items-center px-6"><div className="max-w-xl text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600"><SparklesIcon className="h-7 w-7" /></span><h1 className="mt-5 text-3xl font-semibold tracking-[-.04em]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#60708a]">{detail}</p>{action && (href ? <Button asChild className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700"><Link href={href}>{action}<ArrowRightIcon className="ml-2 h-4 w-4" /></Link></Button> : <Button type="button" onClick={onAction} className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700">{action}</Button>)}</div></section>;
}

function CareerExplorerPreviewShell() {
  const primaryLinks = ['Home', 'HR', 'People', 'Pay', 'Time', 'Hiring', 'Analytics', 'Learning'];
  const learningLinks = [
    { label: 'Learning Home', href: '/learning' },
    { label: 'My Learning', href: '/learning' },
    { label: 'Catalog', href: '/learning/courses' },
    { label: 'Achievements', href: '/learning/achievements' },
    { label: 'Learning Paths', href: '/learning/paths' },
    { label: 'Career Explorer', href: '/learning/career-explorer' },
  ];

  return (
    <header className="overflow-x-auto bg-[#0c1828] text-white">
      <div className="flex h-[64px] min-w-[980px] items-center border-b border-white/10 px-7">
        <Link href="/" className="mr-10 shrink-0" aria-label="hrive home">
          <Image src="/brand/hrive-wordmark-transparent.png" alt="hrive" width={101} height={31} unoptimized className="h-[27px] w-auto" />
        </Link>
        <nav aria-label="Main navigation" className="flex h-full items-center gap-8 text-sm font-semibold">
          {primaryLinks.map(label => (
            <Link key={label} href={label === 'Learning' ? '/learning' : '#'} className={cn('relative inline-flex h-full items-center text-white/90 hover:text-white', label === 'Learning' && 'text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#28a9e2]')}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-5">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15"><MagnifyingGlassIcon className="h-5 w-5" /></span>
          <BellIcon className="h-5 w-5 text-white/80" />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#20324b] text-sm text-[#56a1e7]">A</span>
          <div className="leading-tight"><p className="text-sm font-semibold">Admin</p><p className="text-[10px] text-white/65">Admin</p></div>
        </div>
      </div>
      <div className="flex h-[54px] min-w-[980px] items-center px-7">
        <nav aria-label="Learning navigation" className="flex h-full items-center gap-8 text-sm font-semibold">
          {learningLinks.map((item, index) => (
            <Link key={item.label} href={item.href} className={cn('relative inline-flex h-full items-center gap-2 text-white/85 hover:text-white', item.label === 'Career Explorer' && 'text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#28a9e2]')}>
              {index === 0 && <AcademicCapIcon className="h-5 w-5" />}
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/learning" className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-white/90"><AdjustmentsHorizontalIcon className="h-5 w-5" />Manage Learning</Link>
      </div>
    </header>
  );
}

function CareerMap({
  roles,
  currentRole,
  selectedRole,
  onSelect,
  onCompare,
  goalRoleId,
  onChooseGoal,
  isSavingGoal,
}: {
  roles: CareerRole[];
  currentRole: string;
  selectedRole: CareerRole;
  onSelect: (roleId: RoleId) => void;
  onCompare: () => void;
  goalRoleId: RoleId | null;
  onChooseGoal: () => void;
  isSavingGoal: boolean;
}) {
  return (
    <section className="relative isolate min-h-[calc(100vh-7.25rem)] overflow-hidden bg-[#fbfaf6] px-6 pb-8 pt-11 lg:pl-14 lg:pr-4">
      <Image
        src="/learning/career-explorer/map-background-v2.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="-z-20 hidden object-cover object-bottom md:block"
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_385px]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#4f6485] dark:text-zinc-400">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.25rem,3.25vw,3rem)] font-semibold leading-[1.02] tracking-[-.052em]">Where could your experience take you next?</h1>
          <p className="mt-3 text-lg text-[#5b6c86] dark:text-zinc-300">Explore potential roles and see how your skills can open new doors.</p>

          <div className="relative mt-[45px] min-h-0 md:min-h-[620px] xl:min-h-[610px]">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-indigo-600 dark:text-indigo-300 md:absolute md:left-0 md:top-[174px]">Your starting point</p>
            <article className="relative z-20 mt-3 w-full max-w-[300px] rounded-[10px] border border-[#ddd9d0] bg-white/95 p-5 shadow-[0_7px_18px_rgba(36,45,66,.08)] dark:border-white/10 dark:bg-[#202532]/95 md:absolute md:left-0 md:top-[204px] md:mt-0">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-sm"><UserCircleIcon className="h-8 w-8" /></span>
                <div><p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Your current role</p><h2 className="mt-1 text-xl font-semibold tracking-[-.025em]">{currentRole}</h2><p className="mt-3 text-sm leading-5 text-[#62718a] dark:text-zinc-400">Based on your employee profile,<br />learning, and verified credentials.</p></div>
              </div>
              <span aria-hidden="true" className="absolute -right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-[5px] border-[#fbfaf6] bg-[#59687d] shadow-sm dark:border-[#151924]"><span className="h-2 w-2 rounded-full bg-white" /></span>
            </article>

            <div className="relative z-20 mt-5 grid w-full max-w-[320px] gap-5 md:absolute md:left-[55%] md:top-[10px] md:mt-0 md:w-[286px] xl:left-[58%]">
              {roles.map(role => <RoleMapCard key={role.id} role={role} selected={selectedRole.id === role.id} onClick={() => onSelect(role.id)} />)}
            </div>
          </div>
        </div>

        <RoleDetailPanel role={selectedRole} goalSelected={goalRoleId === selectedRole.id} onChooseGoal={onChooseGoal} onCompare={onCompare} isSavingGoal={isSavingGoal} />
      </div>
    </section>
  );
}

function RoleMapCard({ role, selected, onClick }: { role: CareerRole; selected: boolean; onClick: () => void }) {
  const Icon = role.icon;
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn('relative w-full rounded-[10px] border bg-white/95 p-5 text-left shadow-[0_7px_18px_rgba(36,45,66,.08)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 dark:bg-[#202532]/95', selected ? 'border-2 border-indigo-600 shadow-[0_8px_22px_rgba(79,70,229,.16)] dark:border-indigo-400' : 'border-[#ddd9d0] hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-500/60')}>
      <div className="flex items-start gap-4">
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full text-white', role.tone === 'indigo' ? 'bg-indigo-600' : 'bg-[#338d87]')}><Icon className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold tracking-[-.03em]">{role.title}</h3>
          <div className="mt-2 flex items-start gap-4"><div><p className={cn('text-xl font-semibold', role.tone === 'indigo' ? 'text-indigo-600 dark:text-indigo-300' : 'text-[#16877c] dark:text-emerald-300')}>{role.readiness}%</p><p className="text-xs text-[#64728a] dark:text-zinc-400">ready</p></div><span className="h-9 w-px bg-[#ddd9d0] dark:bg-white/10" /><div className="flex items-start gap-2"><ClockIcon className="mt-0.5 h-5 w-5 text-[#60718b]" /><div><p className="text-sm font-semibold">{role.months}</p><p className="text-xs text-[#64728a] dark:text-zinc-400">months</p></div></div></div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-5 text-[#586980] dark:text-zinc-400">{role.description}</p>
      {selected && <span aria-hidden="true" className="absolute -right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-[5px] border-[#fbfaf6] bg-indigo-600 shadow-sm dark:border-[#151924]"><span className="h-2 w-2 rounded-full bg-white" /></span>}
    </button>
  );
}

function RoleDetailPanel({ role, goalSelected, onChooseGoal, onCompare, isSavingGoal }: { role: CareerRole; goalSelected: boolean; onChooseGoal: () => void; onCompare: () => void; isSavingGoal: boolean }) {
  return (
    <aside className="sticky top-5 flex h-fit flex-col rounded-[12px] border border-[#dedad2] bg-white/95 p-7 shadow-[0_8px_24px_rgba(37,45,68,.05)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1d222e]/95 xl:min-h-[830px]">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-indigo-600 dark:text-indigo-300">Selected path</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{role.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#5b6b83] dark:text-zinc-400">{role.description}</p>

      <div className="mt-6 border-t border-[#dfdcd5] pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold">Your transferable strengths</h3>
        <ul className="mt-4 space-y-4">
          {role.strengths.map(strength => (
            <li key={strength.title} className="flex gap-3"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" /><div><p className="text-sm font-semibold">{strength.title}</p><p className="mt-1 text-xs leading-5 text-[#63718a] dark:text-zinc-400">{strength.detail}</p></div></li>
          ))}
          {role.strengths.length === 0 && <li className="text-xs leading-5 text-[#63718a]">Add skills to your employee profile or complete learning to build evidence for this role.</li>}
        </ul>
      </div>

      <div className="mt-6 border-t border-[#dfdcd5] pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold">Skill gaps to build</h3>
        <ul className="mt-4 space-y-4">
          {role.gaps.map(gap => (
            <li key={gap.title} className="flex gap-3"><span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-indigo-500" /><div><p className="text-sm font-semibold">{gap.title}</p><p className="mt-1 text-xs leading-5 text-[#63718a] dark:text-zinc-400">{gap.detail}</p></div></li>
          ))}
          {role.gaps.length === 0 && <li className="text-xs leading-5 text-[#63718a]">No configured position skill requirements are missing from your current evidence.</li>}
        </ul>
      </div>

      <div className="mt-auto pt-6">
        <Button type="button" onClick={onChooseGoal} disabled={isSavingGoal} className="h-12 w-full rounded-[7px] bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700">{isSavingGoal ? 'Saving goal…' : goalSelected ? <><CheckIcon className="mr-2 h-4 w-4" />Career goal set</> : <>Set as career goal <ArrowRightIcon className="ml-2 h-4 w-4" /></>}</Button>
        {role.course && <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-[7px] border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"><Link href={`/learning/courses/${role.course.id}`}>Start {role.course.title}<ArrowRightIcon className="ml-2 h-4 w-4" /></Link></Button>}
        <Button type="button" variant="outline" onClick={onCompare} className="mt-3 h-11 w-full rounded-[7px] border-[#d8d8d5] bg-white text-sm font-semibold hover:bg-[#f7f6f2] dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5">Compare roles <ScaleIcon className="ml-2 h-4 w-4" /></Button>
      </div>
    </aside>
  );
}

function CareerComparison({ roles, currentRole, selectedRole, onSelect, goalRoleId, onChooseGoal, isSavingGoal }: { roles: CareerRole[]; currentRole: string; selectedRole: CareerRole; onSelect: (roleId: RoleId) => void; goalRoleId: RoleId | null; onChooseGoal: () => void; isSavingGoal: boolean }) {
  return (
    <section className="relative isolate min-h-[calc(100vh-7.25rem)] overflow-hidden px-6 pb-7 pt-14 lg:px-14">
      <Image src="/learning/adventure-trail-hero.png" alt="" fill priority unoptimized sizes="100vw" className="-z-20 object-cover object-[82%_10%] opacity-[.18] dark:opacity-[.08]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#fbfaf6]/86 dark:bg-[#151924]/90" />
      <div><div><p className="text-sm font-semibold text-[#4f6485] dark:text-zinc-400">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</p><h1 className="mt-3 text-[clamp(2.25rem,3.25vw,3rem)] font-semibold leading-none tracking-[-.052em]">Choose where to grow next</h1><p className="mt-3 text-lg text-[#5b6c86] dark:text-zinc-300">Compare paths built from the skills you already have.</p></div></div>

      <section className="mt-5 grid gap-5 rounded-[10px] border border-[#dedad2] bg-white/95 px-7 py-5 shadow-[0_5px_16px_rgba(37,45,68,.04)] dark:border-white/10 dark:bg-[#1d222e]/95 lg:grid-cols-[330px_minmax(0,1fr)_310px] lg:items-center">
        <div className="flex items-center gap-5"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo-600 text-white"><UserCircleIcon className="h-8 w-8" /></span><div><p className="text-sm text-[#5b6b83] dark:text-zinc-400">Starting from</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.035em]">{currentRole}</h2></div></div>
        <div><p className="text-sm font-semibold text-[#52627b] dark:text-zinc-300">Your strongest transferable skills</p><div className="mt-3 grid gap-4 sm:grid-cols-2">{selectedRole.strengths.slice(0, 2).map((strength, index) => <StrengthSummary key={strength.title} icon={index ? PresentationChartLineIcon : UserGroupIcon} title={strength.title} detail={strength.detail} />)}{selectedRole.strengths.length === 0 && <p className="text-xs leading-5 text-[#63718a]">Add employee skills or complete learning to build evidence.</p>}</div></div>
        <div className="border-[#e2ded6] lg:border-l lg:pl-7 dark:border-white/10"><p className="text-sm text-[#5b6b83] dark:text-zinc-400">Best destination match</p><div className="mt-2 flex items-center gap-5"><p className="text-3xl font-semibold text-indigo-600 dark:text-indigo-300">{roles[0]?.readiness || 0}%</p><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e6e8] dark:bg-white/10"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${roles[0]?.readiness || 0}%` }} /></div></div><p className="mt-1 text-xs text-[#63718a] dark:text-zinc-400">Profile match</p></div>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-3">{roles.map((role, index) => <ComparisonLane key={role.id} role={role} currentRole={currentRole} pathNumber={index + 1} selected={selectedRole.id === role.id} goalSelected={goalRoleId === role.id} onSelect={() => onSelect(role.id)} onChooseGoal={onChooseGoal} isSavingGoal={isSavingGoal} />)}</section>
      <p className="mt-4 flex items-center gap-2 text-xs text-[#66748a] dark:text-zinc-400"><MapIcon className="h-4 w-4" />Readiness reflects how well your current skills match the requirements for each role.</p>
    </section>
  );
}

function StrengthSummary({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return <div className="flex items-start gap-3"><Icon className="h-7 w-7 shrink-0 text-indigo-600 dark:text-indigo-300" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-[#63718a] dark:text-zinc-400">{detail}</p></div></div>;
}

function ComparisonLane({ role, currentRole, pathNumber, selected, goalSelected, onSelect, onChooseGoal, isSavingGoal }: { role: CareerRole; currentRole: string; pathNumber: number; selected: boolean; goalSelected: boolean; onSelect: () => void; onChooseGoal: () => void; isSavingGoal: boolean }) {
  return (
    <article onClick={onSelect} className={cn('flex min-h-[540px] cursor-pointer flex-col rounded-[10px] border bg-white/95 p-5 transition-[border-color,box-shadow] dark:bg-[#1d222e]/95', selected ? 'border-2 border-indigo-500 shadow-[0_8px_22px_rgba(79,70,229,.12)]' : 'border-[#dedad2] hover:border-indigo-300 dark:border-white/10')}>
      <div className="flex items-start justify-between gap-4">
        <div><span className={cn('inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[.08em]', selected ? 'bg-[#1f4fb8] text-white' : 'bg-[#edf2fb] text-[#3156a7] dark:bg-white/10 dark:text-indigo-200')}>{selected ? <><SparklesIcon className="mr-1 h-3 w-3" />Selected</> : `Path ${pathNumber}`}</span><h2 className="mt-3 text-xl font-semibold tracking-[-.03em]">{role.title}</h2></div>
        <div className="text-right"><p className="text-xs text-[#5d6c83] dark:text-zinc-400">Path readiness</p><p className={cn('mt-1 text-2xl font-semibold', role.tone === 'teal' ? 'text-emerald-600 dark:text-emerald-300' : 'text-indigo-600 dark:text-indigo-300')}>{role.comparisonReadiness}%</p><div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#e5e6e8] dark:bg-white/10"><div className={cn('h-full rounded-full', role.tone === 'teal' ? 'bg-emerald-600' : 'bg-indigo-600')} style={{ width: `${role.comparisonReadiness}%` }} /></div></div>
      </div>
      <ol className="mt-5 space-y-0"><PathStep icon={UserCircleIcon} title={currentRole} detail="Current role" first /><PathStep icon={role.icon} title={role.intermediateRole} detail={`Next step · ~${role.months} months`} /><PathStep icon={FlagIcon} title={role.title} detail={`Destination role · ~${role.destinationMonths}`} last /></ol>
      {selected && <div className="mt-3 border-t border-[#dedad2] pt-3 dark:border-white/10"><p className="text-xs font-semibold">What changes in this role</p><p className="mt-1.5 text-xs leading-5 text-[#63718a] dark:text-zinc-400">{role.change}</p></div>}
      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-[#dedad2] pt-3 text-xs dark:border-white/10"><div><p className="font-semibold">Your strengths that translate</p><ul className="mt-3 space-y-2 text-[#53647c] dark:text-zinc-300">{role.strengths.slice(0, 2).map(item => <li key={item.title} className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-600" />{item.title}</li>)}</ul></div><div><p className="font-semibold">Skills to build</p><ul className="mt-3 space-y-2 text-[#53647c] dark:text-zinc-300">{role.gaps.slice(0, 2).map(item => <li key={item.title} className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />{item.title}</li>)}</ul></div></div>
      {selected && role.course && <Link href={`/learning/courses/${role.course.id}`} onClick={event => event.stopPropagation()} className="mt-3 flex items-center justify-between rounded-[7px] border border-[#d9dce5] bg-[#f8f9fc] px-3 py-2 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5"><div><p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">Recommended first step</p><p className="mt-0.5 text-xs font-semibold">{role.course.title}</p></div><div className="flex items-center gap-2 text-xs text-[#5c6b82] dark:text-zinc-400"><ClockIcon className="h-4 w-4" />{role.course.durationHours || 0}h <ArrowRightIcon className="h-4 w-4" /></div></Link>}
      <div className="mt-auto pt-3"><div className="mb-3 flex items-center justify-between border-t border-[#dedad2] pt-3 text-xs dark:border-white/10"><span className="inline-flex items-center gap-2 text-[#5c6b82] dark:text-zinc-400"><ClockIcon className="h-4 w-4" />Est. time to destination</span><span className="font-semibold">~{role.destinationMonths}</span></div>{selected ? <Button type="button" disabled={isSavingGoal} onClick={event => { event.stopPropagation(); onChooseGoal(); }} className="h-10 w-full rounded-[7px] bg-[#194eae] font-semibold text-white hover:bg-[#123f91]">{isSavingGoal ? 'Saving goal…' : goalSelected ? <><CheckIcon className="mr-2 h-4 w-4" />Career goal set</> : 'Set as career goal'}</Button> : <button type="button" onClick={event => { event.stopPropagation(); onSelect(); }} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">View full role profile <ArrowRightIcon className="h-4 w-4" /></button>}</div>
    </article>
  );
}

function PathStep({ icon: Icon, title, detail, first, last }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string; first?: boolean; last?: boolean }) {
  return (
    <li className="relative flex min-h-[58px] gap-3">
      {!first && <span aria-hidden="true" className="absolute -top-5 left-[17px] h-5 border-l border-dashed border-[#8493aa]" />}
      {!last && <span aria-hidden="true" className="absolute left-[17px] top-9 h-[22px] border-l border-dashed border-[#8493aa]" />}
      <span className="z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white"><Icon className="h-5 w-5" /></span>
      <div className="pt-0.5"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-4 text-[#60708a] dark:text-zinc-400">{detail}</p></div>
    </li>
  );
}
