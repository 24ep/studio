"use client";

import { CalendarDays, CheckCircle2, MessageSquareText, Target, UsersRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';

const exampleGoals = [
  { title: 'Increase new logos', detail: 'Acquire 20 new enterprise logos in FY2026.', progress: 87, target: '20', actual: '17.4' },
  { title: 'Grow revenue from existing accounts', detail: 'Increase revenue from existing accounts by 15%.', progress: 74, target: '15%', actual: '11.1%' },
  { title: 'Improve sales process efficiency', detail: 'Reduce sales cycle time by 10% through pipeline discipline.', progress: 72, target: '10%', actual: '7.2%' },
];

const skills = [
  ['Client Relationship', 4.2, 'Advanced'],
  ['Communication', 4.0, 'Advanced'],
  ['Sales Execution', 3.8, 'Proficient'],
  ['Problem Solving', 3.6, 'Proficient'],
  ['Collaboration', 3.2, 'Developing'],
] as const;

const feedback = [
  { initials: 'BT', name: 'Ben Thompson', when: '2 days ago', tone: 'Positive', text: 'Great progress on new logos this quarter. Your pipeline coverage is strong.' },
  { initials: 'BT', name: 'Ben Thompson', when: '2 weeks ago', tone: 'Coaching', text: "Let’s work on shortening the sales cycle in the mid-market segment." },
  { initials: 'LC', name: 'Linda Chen', when: '1 month ago', tone: 'Positive', text: 'Anucha led a great demo and answered all the tough questions.' },
];

export function PerformanceGrowthCanvas({ data, onStartCheckIn }: { data: PerformanceWorkspaceData; onStartCheckIn: () => void }) {
  const employee = data.selectedEmployee;
  const goals = data.goals.length ? data.goals.slice(0, 3).map((goal, index) => ({
    title: String(goal.title || goal.name || exampleGoals[index]?.title || 'Performance goal'),
    detail: String(goal.description || exampleGoals[index]?.detail || 'Goal progress for the current performance period.'),
    progress: Number(goal.progress || exampleGoals[index]?.progress || 0),
    target: String(goal.targetValue || goal.target || exampleGoals[index]?.target || '—'),
    actual: String(goal.currentValue || goal.actual || exampleGoals[index]?.actual || '—'),
  })) : exampleGoals;
  const average = Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / Math.max(goals.length, 1));

  return <div className="grid min-h-[710px] xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0 xl:border-r xl:border-border">
      <section className="border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-400">Goal progress</p><p className="mt-2 text-sm text-muted-foreground">2026 Performance Period <span className="mx-2">•</span> Jan 1 – Dec 31, 2026</p></div><div className="text-right"><p className="text-2xl font-bold">{average}%</p><p className="text-xs text-muted-foreground">Average progress</p></div></div>
        <div className="mt-7 grid grid-cols-12 items-center gap-0">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, index) => <div key={month} className="relative text-center"><span className="text-xs text-muted-foreground">{month}</span><div className="mt-3 flex items-center"><span className={`h-2.5 w-2.5 rounded-full ${index < 7 ? 'bg-blue-500' : index === 7 ? 'bg-background ring-2 ring-blue-500' : 'bg-slate-500'}`} /><span className={`h-0.5 flex-1 ${index < 7 ? 'bg-blue-500' : 'bg-slate-600'}`} /></div></div>)}</div>
        <div className="mt-6 divide-y divide-border border-t border-border">{goals.map(goal => <div key={goal.title} className="grid grid-cols-[minmax(0,1fr)_70px_100px_100px] items-center gap-4 py-4"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-950 text-emerald-400"><Target className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{goal.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{goal.detail}</p></div></div><div><p className="text-lg font-bold">{goal.progress}%</p><p className="text-xs text-emerald-400">On track</p></div><p className="text-xs text-muted-foreground">Target: <span className="text-foreground">{goal.target}</span></p><p className="text-xs text-muted-foreground">Actual: <span className="text-foreground">{goal.actual}</span></p></div>)}</div>
      </section>
      <section className="px-6 py-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-400">Competencies</p><p className="mt-2 text-xs text-muted-foreground">Assessed 2 weeks ago <span className="mx-2">•</span> By {employee?.managerName || 'Ben Thompson'}</p></div><Button variant="ghost" size="sm" className="text-blue-400">View all</Button></div><div className="mt-5 space-y-5">{skills.map(([label, score, level]) => <div key={label} className="grid grid-cols-[170px_minmax(0,1fr)_42px_80px] items-center gap-4 text-sm"><span>{label}</span><div className="h-1 bg-slate-800"><div className="h-1 bg-blue-500" style={{ width: `${score / 5 * 100}%` }} /></div><strong>{score.toFixed(1)}</strong><span className="text-xs text-muted-foreground">{level}</span></div>)}</div></section>
    </div>
    <aside>
      <section className="border-b border-border p-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-400">Upcoming check-in</p><div className="mt-5 flex gap-4"><div className="grid h-16 w-16 place-items-center border border-border text-center"><span className="text-xs text-muted-foreground">AUG</span><strong className="-mt-3 text-xl">20</strong></div><div><p className="text-xs text-muted-foreground">1:00 PM – 1:45 PM</p><p className="mt-1 font-semibold">Performance check-in</p><p className="mt-1 text-xs text-muted-foreground">With {employee?.managerName || 'Ben Thompson'}</p></div></div><p className="mt-5 text-xs text-muted-foreground">Agenda</p><div className="mt-3 space-y-3 border-y border-border py-4 text-sm">{['Review goal progress','Discuss wins and challenges','Development update','Agree on next steps'].map(item => <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" />{item}</p>)}</div><Button variant="ghost" size="sm" className="mt-3 px-0 text-blue-400" onClick={onStartCheckIn}>View talking points</Button></section>
      <section className="p-6"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-400">Recent feedback</p><Button variant="ghost" size="sm" className="text-blue-400">View all</Button></div><div className="mt-4 space-y-6">{feedback.map((item, index) => <div key={`${item.name}-${index}`} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold">{item.initials}</span><div><div className="flex items-center gap-2"><p className="text-sm font-semibold">{item.name}</p><span className="border border-border px-1.5 py-0.5 text-[10px] text-emerald-400">{item.tone}</span></div><p className="text-xs text-muted-foreground">{item.when}</p><p className="mt-2 text-xs leading-5 text-slate-300">{item.text}</p></div></div>)}</div></section>
    </aside>
  </div>;
}
