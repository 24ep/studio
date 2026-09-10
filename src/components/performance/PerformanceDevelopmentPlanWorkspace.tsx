"use client";

import * as React from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  MessageCircleMore,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { cn } from '@/lib/utils';
import { formatDate, percent } from './performance-ui';

type ActionName = 'check-in' | 'feedback' | 'recognition' | 'development' | 'evidence';
type Plan = {
  id: string;
  title: string;
  competency: string;
  purpose: string;
  outcome: string;
  status: string;
  progress: number;
  nextAction: string;
  nextActionDate: string;
  dueDate: string;
  employeeName: string;
  managerName: string;
  actions: PlanAction[];
};
type PlanAction = {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string;
  evidence?: string;
  raw?: Record<string, unknown>;
};

const fallbackPlans: Plan[] = [
  {
    id: 'strategic-account-planning',
    title: 'Strengthen strategic account planning',
    competency: 'Strategic thinking',
    purpose: 'Build a repeatable strategic account planning approach to drive stronger account growth and retention.',
    outcome: 'Deliver 3 strategic account plans that are mutually agreed with customers and drive measurable growth commitments.',
    status: 'in_progress',
    progress: 38,
    nextAction: 'Develop account insights & growth opportunities',
    nextActionDate: '2026-08-20',
    dueDate: '2026-12-31',
    employeeName: 'Anucha Prom',
    managerName: 'Ben Thompson',
    actions: [
      { id: 'workshop', title: 'Complete Strategic Account Planning workshop', status: 'completed', progress: 100, dueDate: '2026-07-15', evidence: 'Certificate' },
      { id: 'insights', title: 'Develop account insights & growth opportunities', status: 'in_progress', progress: 38, dueDate: '2026-08-25', evidence: 'Insights deck' },
      { id: 'plans', title: 'Build 3 account plans and get stakeholder buy-in', status: 'not_started', progress: 0, dueDate: '2026-10-30' },
      { id: 'present', title: 'Present plans to leadership and capture feedback', status: 'not_started', progress: 0, dueDate: '2026-11-20' },
      { id: 'iterate', title: 'Track plan impact and iterate', status: 'not_started', progress: 0, dueDate: '2026-12-31' },
    ],
  },
  {
    id: 'executive-communication',
    title: 'Executive communication',
    competency: 'Executive presence',
    purpose: 'Communicate recommendations with clarity and confidence for senior stakeholders.',
    outcome: 'Lead three executive reviews with concise narratives, clear decisions, and documented follow-through.',
    status: 'in_progress',
    progress: 15,
    nextAction: 'Draft the Q3 executive account review',
    nextActionDate: '2026-09-05',
    dueDate: '2027-01-31',
    employeeName: 'Anucha Prom',
    managerName: 'Ben Thompson',
    actions: [
      { id: 'storyline', title: 'Build an executive-ready storyline', status: 'in_progress', progress: 30, dueDate: '2026-09-05' },
      { id: 'review', title: 'Lead an executive account review', status: 'not_started', progress: 0, dueDate: '2026-11-30' },
      { id: 'feedback', title: 'Capture stakeholder feedback and improve', status: 'not_started', progress: 0, dueDate: '2027-01-31' },
    ],
  },
  {
    id: 'product-certification',
    title: 'Product knowledge certification',
    competency: 'Product knowledge',
    purpose: 'Demonstrate confident product knowledge in customer conversations.',
    outcome: 'Complete certification and apply the learning in customer discovery calls.',
    status: 'completed',
    progress: 100,
    nextAction: 'Completed',
    nextActionDate: '2026-07-15',
    dueDate: '2026-07-15',
    employeeName: 'Anucha Prom',
    managerName: 'Ben Thompson',
    actions: [{ id: 'certification', title: 'Complete product knowledge certification', status: 'completed', progress: 100, dueDate: '2026-07-15', evidence: 'Certificate' }],
  },
];

export function PerformanceDevelopmentPlanWorkspace({
  data,
  onAction,
  onUpdate,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
  onUpdate: (row: Record<string, unknown>) => void;
}) {
  const plans = React.useMemo(() => buildPlans(data), [data]);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  React.useEffect(() => setSelectedPlanId(null), [data.selectedEmployee?.id]);

  if (selectedPlan) {
    return <PlanDetail plan={selectedPlan} onBack={() => setSelectedPlanId(null)} onAction={onAction} onUpdate={onUpdate} />;
  }

  return <PlanList plans={plans} onOpen={plan => setSelectedPlanId(plan.id)} onCreate={() => onAction('development')} />;
}

function PlanList({ plans, onOpen, onCreate }: { plans: Plan[]; onOpen: (plan: Plan) => void; onCreate: () => void }) {
  const active = plans.filter(plan => plan.status !== 'completed').length;
  const completed = plans.filter(plan => plan.status === 'completed').length;
  const dueSoon = plans.filter(plan => plan.status !== 'completed' && plan.nextActionDate <= '2026-08-31').length;

  return (
    <section className="min-h-[670px] bg-background px-5 py-5 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.025em] text-slate-950 dark:text-slate-50">Development plans</h2>
          <div className="mt-5 flex divide-x divide-border">
            <Summary label="Active plans" value={active} />
            <Summary label="Due soon" value={dueSoon} tone="warning" />
            <Summary label="Completed" value={completed} tone="success" />
          </div>
        </div>
        <Button onClick={onCreate} className="bg-[#0b46b5] text-white hover:bg-[#083b9b]">Create development plan</Button>
      </header>

      <div className="mt-6 overflow-x-auto border-y border-border">
        <div className="hidden min-w-[930px] grid-cols-[minmax(220px,1.45fr)_120px_130px_115px_130px_84px_80px] gap-3 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 xl:grid">
          <span>Plan title &amp; competency</span><span>Progress</span><span>Next action</span><span>Due date</span><span>Owner / Manager</span><span>Status</span><span className="text-right">View</span>
        </div>
        {plans.map((plan, index) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onOpen(plan)}
            className={cn(
              'group grid w-full gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-blue-50/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3459a8] dark:hover:bg-blue-950/20 xl:min-w-[930px] xl:grid-cols-[minmax(220px,1.45fr)_120px_130px_115px_130px_84px_80px] xl:items-center xl:gap-3',
              index === 0 && 'bg-blue-50/35 dark:bg-blue-950/10',
            )}
          >
            <div className="min-w-0">
              <p className="font-bold text-[#0b55c4] group-hover:underline">{plan.title}</p>
              <p className="mt-1 text-xs text-slate-500">{plan.competency}</p>
            </div>
            <div>
              <div className="flex items-center gap-3"><span className="w-8 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{plan.progress}%</span><Progress value={plan.progress} className="h-1.5 flex-1 bg-slate-100 [&>div]:bg-[#0b55c4] dark:bg-slate-800" /></div>
            </div>
            <DateCell value={plan.nextActionDate} helper={plan.status === 'completed' ? 'Completed' : plan.nextAction} />
            <DateCell value={plan.dueDate} helper={plan.status === 'completed' ? 'Completed' : undefined} />
            <div className="text-xs leading-5 text-slate-700 dark:text-slate-300"><p>{plan.employeeName}</p><p className="text-slate-500">{plan.managerName}</p></div>
            <PlanStatus status={plan.status} />
            <div className="flex items-center justify-end gap-1.5"><span className="text-xs font-semibold text-[#0b55c4]">View plan</span><ChevronRight className="h-4 w-4 text-[#0b55c4]" aria-hidden /></div>
          </button>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">Learning recommendations</h3>
          <p className="mt-1 text-xs text-slate-500">Based on evidence and competency gaps.</p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          <LearningRow title="Strategic Account Planning Fundamentals" linked="Strengthen strategic account planning" duration="25 min" />
          <LearningRow title="Customer Insights to Growth" linked="Executive communication" duration="35 min" />
        </div>
      </section>
    </section>
  );
}

function PlanDetail({ plan, onBack, onAction, onUpdate }: { plan: Plan; onBack: () => void; onAction: (action: ActionName) => void; onUpdate: (row: Record<string, unknown>) => void }) {
  const nextAction = plan.actions.find(action => action.status !== 'completed') || plan.actions[0];
  return (
    <section className="min-h-[670px] bg-background">
      <div className="border-b border-border px-5 py-4">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1.5 px-2 text-xs text-[#3459a8]" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden />Development plans</Button>
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1.7fr)_430px]">
        <div className="px-5 py-5 xl:border-r xl:border-border">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Development goal</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950 dark:text-slate-50">{plan.title}</h2>
              <p className="mt-2 text-xs text-slate-500">Target date {formatDate(plan.dueDate)}</p>
            </div>
            <Button variant="outline" onClick={() => onAction('development')} className="border-[#9db0d2] text-[#173d7a]">Add development action</Button>
          </div>

          <div className="grid gap-5 border-b border-border py-5 md:grid-cols-2">
            <Definition label="Purpose" value={plan.purpose} />
            <Definition label="Target outcome" value={plan.outcome} />
          </div>

          <div className="border-b border-border py-5">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Progress</p>
            <div className="mt-2 flex items-center gap-4"><span className="text-lg font-bold tabular-nums">{plan.progress}%</span><Progress value={plan.progress} className="h-2 flex-1 bg-slate-100 [&>div]:bg-[#0b55c4] dark:bg-slate-800" /><span className="text-xs text-slate-500">{plan.progress}% complete</span></div>
          </div>

          <div className="py-5">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">Action plan</h3>
            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[690px]">
                <div className="grid grid-cols-[minmax(300px,1fr)_120px_120px_120px] gap-3 border-b border-border px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"><span>Action</span><span>Status</span><span>Due date</span><span>Evidence</span></div>
                {plan.actions.map((action, index) => (
                  <button key={action.id} type="button" onClick={() => action.raw ? onUpdate(action.raw) : onAction('development')} className="grid w-full grid-cols-[minmax(300px,1fr)_120px_120px_120px] gap-3 border-b border-border px-2 py-3 text-left text-xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3459a8] dark:hover:bg-slate-900/50">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{index + 1}. {action.title}</span><ActionStatus status={action.status} /><span className="text-slate-600 dark:text-slate-400">{formatDate(action.dueDate)}</span><span className={action.evidence ? 'text-[#0b55c4]' : 'text-slate-400'}>{action.evidence || '—'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border py-5">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">Recent activity &amp; evidence</h3>
            <div className="mt-4 space-y-4">
              <Activity icon="done" date="Jul 15, 2026" title="Completed Strategic Account Planning workshop" detail="Evidence added: Certificate" />
              <Activity icon="active" date="Jul 30, 2026" title="Added account insights deck for Acme Corp." detail="Evidence added: Insights deck" />
              <Activity icon="future" date="Aug 10, 2026" title="Checked in with Ben Thompson" detail="Reviewed opportunity sizing and next steps." />
            </div>
          </div>
        </div>

        <aside className="px-5 py-5">
          <section className="border-b border-border pb-5">
            <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold">Next best action</h3><span className="text-xs font-semibold text-amber-600">Due {formatDate(plan.nextActionDate)}</span></div>
            <div className="mt-4 flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-blue-200 text-[#0b55c4]"><TrendingUp className="h-5 w-5" aria-hidden /></span><div><p className="text-sm font-bold">Update progress on “{nextAction?.title}”</p><p className="mt-1 text-xs leading-5 text-slate-500">Share what changed, what’s next, and any help you need.</p></div></div>
            <Button className="mt-4 w-full bg-[#0b46b5] text-white hover:bg-[#083b9b]" onClick={() => nextAction?.raw ? onUpdate(nextAction.raw) : onAction('development')}>Update progress</Button>
          </section>

          <section className="border-b border-border py-5">
            <h3 className="text-sm font-bold">Accountability</h3>
            <Person label="Employee" initials="AP" name={plan.employeeName} role="Sales Executive" />
            <Person label="Manager" initials="BT" name={plan.managerName} role="Engineering Manager" />
          </section>

          <section className="border-b border-border py-5">
            <h3 className="text-sm font-bold">Related competency gap</h3>
            <div className="mt-3 flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/30"><Target className="h-5 w-5" aria-hidden /></span><div><p className="text-sm font-bold">{plan.competency}</p><p className="mt-1 text-xs leading-5 text-slate-500">Strengthen the ability to anticipate customer needs and build long-term growth strategies.</p><button type="button" className="mt-2 text-xs font-semibold text-[#0b55c4]">View in competencies</button></div></div>
          </section>

          <section className="border-b border-border py-5">
            <h3 className="text-sm font-bold">Manager coaching prompt</h3>
            <div className="mt-3 flex gap-2 bg-violet-50 px-3 py-2.5 text-xs leading-5 text-violet-950 dark:bg-violet-950/25 dark:text-violet-100"><MessageCircleMore className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden /><span>What customer insights have most influenced your plan so far, and where do you need more clarity?</span></div>
          </section>

          <section className="pt-5">
            <h3 className="text-sm font-bold">Learning recommendations</h3>
            <div className="mt-3 divide-y divide-border border-y border-border"><LearningRow title="Strategic Account Planning Fundamentals" linked="Completed workshop certificate" duration="25 min" /><LearningRow title="Customer Insights to Growth" linked="Insights deck" duration="35 min" /></div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function buildPlans(data: PerformanceWorkspaceData): Plan[] {
  if (!data.developmentPlans.length) return fallbackPlans;
  const employeeName = data.selectedEmployee?.name || 'Employee';
  return data.developmentPlans.map((raw, index) => {
    const actions: PlanAction[] = data.developmentActions.filter(item => String(item.planId) === String(raw.id)).map(item => ({
      id: String(item.id), title: String(item.title || 'Development action'), status: String(item.status || 'not_started'), progress: percent(item.progress), dueDate: String(item.dueDate || raw.targetDate || ''), evidence: item.evidence ? 'Evidence' : undefined, raw: item,
    }));
    const progress = actions.length ? Math.round(actions.reduce((sum, action) => sum + action.progress, 0) / actions.length) : (String(raw.status) === 'completed' ? 100 : 0);
    const next = actions.find(action => action.status !== 'completed');
    return {
      id: String(raw.id), title: String(raw.title || `Development plan ${index + 1}`), competency: String(next?.raw?.relatedCompetency || raw.planType || 'Skill development').replace(/_/g, ' '), purpose: String(raw.aspiration || 'Build a focused capability through practical actions and coaching.'), outcome: String(raw.employeeComments || 'Apply the capability consistently and demonstrate progress through evidence.'), status: String(raw.status || 'in_progress'), progress, nextAction: next?.title || 'Completed', nextActionDate: next?.dueDate || String(raw.completedAt || raw.targetDate || ''), dueDate: String(raw.targetDate || next?.dueDate || ''), employeeName, managerName: 'Manager', actions: actions.length ? actions : [{ id: `${raw.id}-start`, title: 'Define the first development action', status: 'not_started', progress: 0, dueDate: String(raw.targetDate || ''), raw }],
    };
  });
}

function Summary({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' | 'success' }) {
  return <div className="min-w-[108px] px-5 first:pl-0"><p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p><p className={cn('mt-1 text-xl font-bold tabular-nums', tone === 'warning' ? 'text-amber-600' : tone === 'success' ? 'text-emerald-600' : 'text-slate-950 dark:text-slate-50')}>{value}</p></div>;
}
function DateCell({ value, helper }: { value: string; helper?: string }) { return <div className="text-xs leading-5"><p className="font-medium text-slate-700 dark:text-slate-300">{formatDate(value)}</p>{helper ? <p className="truncate text-slate-500">{helper}</p> : null}</div>; }
function PlanStatus({ status }: { status: string }) { const completed = status === 'completed'; return <Badge variant="outline" className={cn('w-fit rounded-md px-2 py-1 text-[11px] font-semibold', completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700')}>{completed ? 'Completed' : 'Active'}</Badge>; }
function Definition({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p><p className="mt-1 max-w-[58ch] text-sm leading-6 text-slate-600 dark:text-slate-300">{value}</p></div>; }
function ActionStatus({ status }: { status: string }) { const completed = status === 'completed'; const active = status === 'in_progress'; return <span className={cn('inline-flex w-fit items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold', completed ? 'bg-emerald-50 text-emerald-700' : active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')} >{completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}{completed ? 'Completed' : active ? 'In progress' : 'Not started'}</span>; }
function Person({ label, initials, name, role }: { label: string; initials: string; name: string; role: string }) { return <div className="mt-3"><p className="mb-1 text-[11px] text-slate-500">{label}</p><div className="flex items-center gap-3 border-b border-border pb-3 last:border-0"><Avatar className="h-8 w-8 rounded-md"><AvatarFallback className="rounded-md text-[11px] font-bold">{initials}</AvatarFallback></Avatar><div><p className="text-xs font-semibold">{name}</p><p className="mt-0.5 text-[11px] text-slate-500">{role}</p></div></div></div>; }
function LearningRow({ title, linked, duration }: { title: string; linked: string; duration: string }) { return <a href="/workforce/learning" className="flex items-center gap-3 px-2 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3459a8] dark:hover:bg-slate-900/50"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#0b2c62] text-white"><BookOpenCheck className="h-4 w-4" aria-hidden /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p><p className="mt-1 truncate text-[11px] text-slate-500">Linked to: {linked}</p></div><span className="text-xs text-slate-500">{duration}</span><ArrowUpRight className="h-4 w-4 text-[#0b55c4]" aria-hidden /></a>; }
function Activity({ icon, date, title, detail }: { icon: 'done' | 'active' | 'future'; date: string; title: string; detail: string }) { return <div className="grid grid-cols-[18px_74px_minmax(0,1fr)] gap-3 text-xs"><span className={cn('mt-1 grid h-4 w-4 place-items-center rounded-full', icon === 'done' ? 'text-emerald-600' : icon === 'active' ? 'bg-blue-600' : 'bg-slate-300')}>{icon === 'done' ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}</span><span className="text-slate-500">{date}</span><div><p className="font-medium text-slate-700 dark:text-slate-300">{title}</p><p className="mt-1 text-slate-500">{detail}</p></div></div>; }
