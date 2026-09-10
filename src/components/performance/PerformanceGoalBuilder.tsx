"use client";

import * as React from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Gauge,
  GraduationCap,
  ListFilter,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { cn } from '@/lib/utils';

type GoalTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  metric: string;
  baseline: string;
  target: string;
  unit: string;
  icon: typeof Target;
};

type GoalListItem = { id: string; title: string; description: string; progress: number; status: string; dueDate: string; metric: string; weight: string };

const templates: GoalTemplate[] = [
  { id: 'pipeline', category: 'Company aligned', title: 'Increase enterprise pipeline quality', description: 'Improve the quality and conversion potential of enterprise opportunities.', metric: 'Qualified opportunities', baseline: '18', target: '30', unit: 'per month', icon: Building2 },
  { id: 'logos', category: 'Company aligned', title: 'Grow new enterprise logos', description: 'Acquire new enterprise customers and expand market presence.', metric: 'New enterprise logos', baseline: '12', target: '20', unit: 'logos', icon: Target },
  { id: 'team-kpi', category: 'Team KPI', title: 'Achieve team pipeline target', description: 'Improve team pipeline coverage against the quarterly target.', metric: 'Pipeline coverage', baseline: '2.4', target: '3.5', unit: 'times target', icon: Users },
  { id: 'development', category: 'Development', title: 'Strengthen solution selling skills', description: 'Build advanced discovery, value framing, and negotiation capability.', metric: 'Skill assessment', baseline: '3.2', target: '4.2', unit: 'out of 5', icon: GraduationCap },
  { id: 'project', category: 'Project outcome', title: 'Deliver strategic client project', description: 'Complete a critical client project on time and within agreed scope.', metric: 'Milestones completed', baseline: '0', target: '8', unit: 'milestones', icon: BriefcaseBusiness },
  { id: 'custom', category: 'Custom', title: 'Create a custom goal', description: 'Start with a blank goal and define your own success measures.', metric: '', baseline: '', target: '', unit: '', icon: Sparkles },
];

const steps = [
  ['Goal basics', 'Define the outcome'],
  ['Success measures', 'Define how success will be measured'],
  ['Alignment', 'Connect to company and team priorities'],
  ['Review schedule', 'Set reviews and check-ins'],
  ['Review & create', 'Confirm and create your goal'],
] as const;

export function PerformanceGoalBuilder({ data }: { data: PerformanceWorkspaceData }) {
  const employee = data.selectedEmployee;
  const manager = employee?.managerName || 'Ben Thompson';
  const [mode, setMode] = React.useState<'list' | 'detail' | 'create'>('list');
  const [detailGoal, setDetailGoal] = React.useState<GoalListItem | null>(null);
  const [step, setStep] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState('pipeline');
  const [title, setTitle] = React.useState(templates[0].title);
  const [description, setDescription] = React.useState(templates[0].description);
  const [metric, setMetric] = React.useState(templates[0].metric);
  const [baseline, setBaseline] = React.useState(templates[0].baseline);
  const [target, setTarget] = React.useState(templates[0].target);
  const [unit, setUnit] = React.useState(templates[0].unit);
  const [priority, setPriority] = React.useState('Grow enterprise revenue');
  const [cadence, setCadence] = React.useState('Monthly');
  const [goalScope, setGoalScope] = React.useState<'individual' | 'team'>('individual');
  const [weight, setWeight] = React.useState('25');
  const [startDate, setStartDate] = React.useState('2026-08-17');
  const [dueDate, setDueDate] = React.useState('2026-12-18');
  const [milestones, setMilestones] = React.useState([
    { date: '2026-09-18', target: '22', note: 'Build early momentum in Q1' },
    { date: '2026-10-16', target: '25', note: 'Expand coverage and convert' },
    { date: '2026-11-20', target: '28', note: 'Strengthen late-stage pipeline' },
    { date: '2026-12-18', target: '30', note: 'Achieve year-end target' },
  ]);

  const selectedTemplate = templates.find(item => item.id === templateId) || templates[0];
  const filteredTemplates = templates.filter(item => `${item.category} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  const canContinue = step === 0 ? Boolean(templateId && title.trim() && description.trim() && startDate && dueDate) : step === 1 ? Boolean(metric.trim() && target.trim()) : true;

  function selectTemplate(template: GoalTemplate) {
    setTemplateId(template.id);
    setTitle(template.id === 'custom' ? '' : template.title);
    setDescription(template.id === 'custom' ? '' : template.description);
    setMetric(template.metric);
    setBaseline(template.baseline);
    setTarget(template.target);
    setUnit(template.unit);
    setTemplateOpen(false);
  }

  function createGoal() {
    toast.success(`Goal created for ${employee?.name || 'employee'}`);
    setStep(0);
    setMode('list');
  }

  if (mode === 'list') return <GoalList data={data} onCreate={() => { setStep(0); setMode('create'); }} onOpen={goal => { setDetailGoal(goal); setMode('detail'); }} />;
  if (mode === 'detail' && detailGoal) return <GoalDetail goal={detailGoal} employeeName={employee?.name || 'Employee'} manager={manager} onBack={() => setMode('list')} onEdit={() => { setTitle(detailGoal.title); setDescription(detailGoal.description); setStep(0); setMode('create'); }} />;

  return (
    <section className="min-h-[710px] bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setMode('list')}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to goals</Button>
          <span className="h-7 w-px bg-border" />
          <div>
          <p className="text-[11px] font-semibold text-blue-400">Performance / {employee?.name || 'Employee'} / Goals</p>
          <h2 className="mt-1 text-lg font-bold">Create goal</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success('Draft saved')}>Save draft</Button>
          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => setStep(4)}>Review goal</Button>
        </div>
      </header>

      <div className="grid min-h-[650px] lg:grid-cols-[190px_minmax(0,1fr)_250px] 2xl:grid-cols-[210px_minmax(0,1fr)_280px]">
        <GoalSteps step={step} onChange={setStep} />

        <div className="min-w-0 border-l border-border px-5 py-5 2xl:px-7 2xl:py-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-400">Step {step + 1} of {steps.length}</p><h3 className="mt-2 text-xl font-bold">{steps[step][0]}</h3><p className="mt-1 text-sm text-muted-foreground">{step === 0 ? 'Define the outcome and ownership for this goal.' : `${steps[step][1]}.`}</p></div>{step === 0 ? <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}><Sparkles className="mr-2 h-4 w-4 text-blue-400" />Choose template</Button> : null}</div>

            <div className="mt-6">
              {step === 0 ? <BasicsForm title={title} setTitle={setTitle} description={description} setDescription={setDescription} employeeName={employee?.name || 'Employee'} manager={manager} startDate={startDate} setStartDate={setStartDate} dueDate={dueDate} setDueDate={setDueDate} goalScope={goalScope} setGoalScope={setGoalScope} /> : null}
              {step === 1 ? <MeasuresForm metric={metric} setMetric={setMetric} baseline={baseline} setBaseline={setBaseline} target={target} setTarget={setTarget} unit={unit} setUnit={setUnit} weight={weight} setWeight={setWeight} cadence={cadence} setCadence={setCadence} milestones={milestones} setMilestones={setMilestones} /> : null}
              {step === 2 ? <AlignmentForm priority={priority} setPriority={setPriority} /> : null}
              {step === 3 ? <ScheduleForm cadence={cadence} setCadence={setCadence} dueDate={dueDate} /> : null}
              {step === 4 ? <ReviewGoal title={title} description={description} metric={metric} baseline={baseline} target={target} unit={unit} priority={priority} cadence={cadence} employeeName={employee?.name || 'Employee'} startDate={startDate} dueDate={dueDate} weight={weight} goalScope={goalScope} milestones={milestones} /> : null}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              {step < 4 ? <Button disabled={!canContinue} className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => setStep(value => Math.min(4, value + 1))}>Continue<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={createGoal}><Check className="mr-2 h-4 w-4" />Create goal</Button>}
            </div>
          </div>
        </div>

        <GoalPreview employeeName={employee?.name || 'Employee'} manager={manager} title={title} description={description} metric={metric} baseline={baseline} target={target} unit={unit} priority={priority} cadence={cadence} startDate={startDate} dueDate={dueDate} template={selectedTemplate} weight={weight} goalScope={goalScope} milestones={milestones} />
      </div>
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}><DialogContent className="max-w-3xl p-0"><DialogHeader className="border-b border-border px-5 py-4"><DialogTitle>Choose a goal template</DialogTitle><DialogDescription>Select a template to prefill Goal Basics and its success measures.</DialogDescription></DialogHeader><div className="p-5"><TemplateSelector query={query} setQuery={setQuery} templates={filteredTemplates} selected={templateId} onSelect={selectTemplate} /></div></DialogContent></Dialog>
    </section>
  );
}

function GoalList({ data, onCreate, onOpen }: { data: PerformanceWorkspaceData; onCreate: () => void; onOpen: (goal: GoalListItem) => void }) {
  const employee = data.selectedEmployee;
  const storedGoals = data.goals.filter(goal => !['cancelled', 'archived'].includes(String(goal.status || '').toLowerCase()));
  const examples: GoalListItem[] = [
    { id: 'example-1', title: 'Increase new enterprise logos', description: 'Acquire 20 new enterprise logos in FY2026.', progress: 87, status: 'On track', dueDate: '2026-12-31', metric: '17.4 of 20 logos', weight: '30%' },
    { id: 'example-2', title: 'Grow revenue from existing accounts', description: 'Increase revenue from existing accounts by 15%.', progress: 74, status: 'On track', dueDate: '2026-12-18', metric: '11.1% of 15%', weight: '25%' },
    { id: 'example-3', title: 'Improve sales process efficiency', description: 'Reduce sales cycle time through stronger pipeline discipline.', progress: 42, status: 'Needs attention', dueDate: '2026-10-30', metric: '4.2% of 10%', weight: '20%' },
  ];
  const goals: GoalListItem[] = storedGoals.length ? storedGoals.map((goal,index) => ({ id: String(goal.id || index), title: String(goal.title || goal.name || 'Performance goal'), description: String(goal.description || 'Goal progress for the current performance period.'), progress: Math.max(0,Math.min(100,Number(goal.progress || 0))), status: String(goal.status || 'On track').replaceAll('_',' '), dueDate: String(goal.dueDate || '2026-12-31').slice(0,10), metric: String(goal.currentValue || goal.actual || 'Progress recorded'), weight: `${goal.weight || 25}%` })) : examples;
  const average = Math.round(goals.reduce((sum,goal)=>sum+goal.progress,0)/Math.max(goals.length,1));
  const atRisk = goals.filter(goal=>goal.status.toLowerCase().includes('attention')||goal.status.toLowerCase().includes('risk')).length;
  return <section className="min-h-[710px] bg-background"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5"><div><p className="text-[11px] font-semibold text-blue-400">Performance / {employee?.name || 'Employee'} / Goals</p><h2 className="mt-1 text-xl font-bold">Goals</h2><p className="mt-1 text-xs text-muted-foreground">Manage outcomes, measures, alignment, and review progress.</p></div><Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Create goal</Button></header><div className="grid divide-x divide-border border-b border-border sm:grid-cols-3"><GoalListMetric label="Active goals" value={goals.length} helper="Current performance period" /><GoalListMetric label="Average progress" value={`${average}%`} helper="Across active goals" /><GoalListMetric label="Needs attention" value={atRisk} helper="Risk or overdue review" warning={atRisk>0} /></div><div className="px-6 py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Goal list</h3><p className="mt-1 text-xs text-muted-foreground">Select a goal to review its detail and progress history.</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm"><ListFilter className="mr-2 h-4 w-4" />All statuses</Button><Input className="h-9 w-56" placeholder="Search goals" /></div></div><div className="mt-4 overflow-hidden border border-border"><div className="grid grid-cols-[minmax(0,1fr)_90px_130px_110px_80px] border-b border-border px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground"><span>Goal</span><span>Progress</span><span>Status</span><span>Due date</span><span>Weight</span></div>{goals.map(goal=><button key={goal.id} type="button" onClick={() => onOpen(goal)} aria-label={`Open goal ${goal.title}`} className="group grid w-full grid-cols-[minmax(0,1fr)_90px_130px_110px_80px] items-center border-b border-border px-4 py-4 text-left last:border-b-0 hover:bg-slate-900/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-500"><span className="min-w-0"><span className="block truncate text-sm font-bold group-hover:text-blue-300">{goal.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{goal.description}</span><span className="mt-2 block text-[11px] text-blue-400">{goal.metric}</span></span><span><span className="block text-sm font-bold">{goal.progress}%</span><span className="mt-2 block h-1.5 w-16 bg-slate-800"><span className="block h-full bg-blue-500" style={{width:`${goal.progress}%`}} /></span></span><span className={cn('w-fit border px-2 py-1 text-[11px] font-semibold capitalize',goal.status.toLowerCase().includes('attention')?'border-amber-800 text-amber-400':'border-emerald-800 text-emerald-400')}>{goal.status}</span><span className="text-xs">{formatDate(goal.dueDate)}</span><span className="text-sm font-bold">{goal.weight}</span></button>)}</div></div></section>;
}

function GoalListMetric({ label, value, helper, warning=false }: { label: string; value: React.ReactNode; helper: string; warning?: boolean }) { return <div className="px-6 py-4"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className={cn('mt-1 text-2xl font-bold',warning&&'text-amber-400')}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div>; }

function GoalDetail({ goal, employeeName, manager, onBack, onEdit }: { goal: GoalListItem; employeeName: string; manager: string; onBack: () => void; onEdit: () => void }) {
  const initials = employeeName.split(/\s+/).map(value=>value[0]).join('').slice(0,2).toUpperCase();
  const target = goal.title.includes('logos') ? '20 logos' : goal.title.includes('revenue') ? '15% growth' : '10% reduction';
  const baseline = goal.title.includes('logos') ? '12 logos' : goal.title.includes('revenue') ? '0%' : '0%';
  const milestoneRows = goal.title.includes('logos') ? [['Sep 18','15','Complete'],['Oct 16','17','Complete'],['Nov 20','19','In progress'],['Dec 31','20','Upcoming']] : [['Sep 18','25%','Complete'],['Oct 16','50%','Complete'],['Nov 20','75%','In progress'],['Dec 18','100%','Upcoming']];
  return <section className="min-h-[710px] bg-background"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4"><div className="flex items-center gap-3"><Button variant="ghost" size="sm" className="h-8 px-2" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to goals</Button><span className="h-7 w-px bg-border" /><div><p className="text-[11px] font-semibold text-blue-400">Performance / {employeeName} / Goals / Detail</p><h2 className="mt-1 text-lg font-bold">Goal detail</h2></div></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={()=>toast.success('Progress check-in scheduled')}>Schedule review</Button><Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={onEdit}>Edit goal</Button></div></header><div className="grid lg:grid-cols-[minmax(0,1fr)_300px]"><main className="min-w-0 border-r border-border"><section className="border-b border-border px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><div className="flex flex-wrap items-center gap-2"><span className={cn('border px-2 py-1 text-[11px] font-semibold',goal.status.toLowerCase().includes('attention')?'border-amber-800 text-amber-400':'border-emerald-800 text-emerald-400')}>{goal.status}</span><span className="border border-border px-2 py-1 text-[11px] text-muted-foreground">Individual goal</span></div><h3 className="mt-3 text-2xl font-bold">{goal.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{goal.description}</p></div><div className="min-w-36 text-right"><p className="text-3xl font-bold">{goal.progress}%</p><p className="mt-1 text-xs text-muted-foreground">Overall progress</p><div className="mt-3 h-2 w-36 bg-slate-800"><div className="h-full bg-blue-500" style={{width:`${goal.progress}%`}} /></div></div></div></section><section className="grid divide-x divide-border border-b border-border sm:grid-cols-4"><DetailMetric label="Current result" value={goal.metric} /><DetailMetric label="Target" value={target} /><DetailMetric label="Weight" value={goal.weight} /><DetailMetric label="Due date" value={formatDate(goal.dueDate)} /></section><section className="px-6 py-5"><div className="grid gap-6 xl:grid-cols-2"><div><h4 className="text-sm font-bold">Success measure</h4><div className="mt-3 divide-y divide-border border-y border-border"><DetailRow label="Metric" value={goal.title.includes('logos')?'New enterprise logos':goal.title.includes('revenue')?'Revenue growth':'Sales cycle reduction'} /><DetailRow label="Baseline" value={baseline} /><DetailRow label="Target" value={target} /><DetailRow label="Review cadence" value="Monthly" /></div></div><div><h4 className="text-sm font-bold">Alignment</h4><div className="mt-3 border border-border p-4"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Company priority</p><p className="mt-1 text-sm font-bold">Grow enterprise revenue</p><div className="my-3 h-4 border-l border-border" /><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Sales objective</p><p className="mt-1 text-sm font-bold">Improve pipeline quality</p><div className="my-3 h-4 border-l border-border" /><p className="text-[10px] font-bold uppercase tracking-[.1em] text-blue-400">Employee goal</p><p className="mt-1 text-sm font-bold">{goal.title}</p></div></div></div><div className="mt-7"><div className="flex items-center justify-between"><div><h4 className="text-sm font-bold">Milestones</h4><p className="mt-1 text-xs text-muted-foreground">Target checkpoints and progress history.</p></div><Button variant="outline" size="sm" onClick={()=>toast.success('Progress update added')}>Update progress</Button></div><div className="mt-3 overflow-hidden border border-border"><div className="grid grid-cols-[120px_100px_minmax(0,1fr)] bg-slate-900/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground"><span>Date</span><span>Target</span><span>Status</span></div>{milestoneRows.map(([date,value,status])=><div key={date} className="grid grid-cols-[120px_100px_minmax(0,1fr)] items-center border-t border-border px-4 py-3 text-xs"><span>{date}, 2026</span><strong>{value}</strong><span className={status==='Complete'?'text-emerald-400':status==='In progress'?'text-blue-400':'text-muted-foreground'}>{status}</span></div>)}</div></div></section></main><aside className="px-5 py-6"><p className="text-xs font-bold uppercase tracking-[.13em] text-blue-400">Goal preview</p><p className="mt-1 text-xs text-muted-foreground">Summary and readiness</p><div className="mt-6 space-y-6"><div><p className="text-xs font-semibold">Ownership</p><div className="mt-3 flex items-center gap-3"><Avatar className="h-9 w-9 border border-border"><AvatarFallback className="bg-slate-800 text-xs">{initials}</AvatarFallback></Avatar><div><p className="text-sm font-bold">{employeeName}</p><p className="text-xs text-muted-foreground">Manager: {manager}</p></div></div></div><PreviewRow icon={CalendarDays} label="Goal period" value={`Aug 17, 2026 – ${formatDate(goal.dueDate)}`} /><PreviewRow icon={ClipboardList} label="Review cadence" value="Monthly" /><PreviewRow icon={Building2} label="Alignment" value="Grow enterprise revenue" /><div className="border-t border-border pt-5"><p className="text-xs font-semibold">Readiness checks</p><div className="mt-3 space-y-3">{['Measurable','Time-bound','Aligned','Actionable'].map(item=><p key={item} className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="h-4 w-4" />{item}</p>)}</div></div><div className="border-t border-border pt-5"><p className="flex gap-2 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Visible to the employee, manager, and relevant stakeholders.</p></div></div></aside></div></section>;
}

function DetailMetric({label,value}:{label:string;value:React.ReactNode}) { return <div className="px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className="mt-2 text-sm font-bold">{value}</p></div>; }
function DetailRow({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right">{value}</strong></div>; }

function GoalSteps({ step, onChange }: { step: number; onChange: (step: number) => void }) {
  return <aside className="px-4 py-5 2xl:px-5 2xl:py-6"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-blue-400 2xl:text-xs">Guided goal builder</p><ol className="mt-5">{steps.map(([label, helper], index) => <li key={label} className="relative pb-5 last:pb-0"><button type="button" onClick={() => onChange(index)} className="group flex w-full gap-2.5 text-left"><span className={cn('relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs', index === step ? 'border-blue-500 bg-blue-600 text-white' : index < step ? 'border-emerald-500 bg-emerald-950 text-emerald-300' : 'border-border text-muted-foreground')}>{index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="min-w-0"><span className={cn('block text-xs font-semibold 2xl:text-sm', index === step ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>{label}</span><span className="mt-1 hidden text-[11px] leading-4 text-muted-foreground 2xl:block">{helper}</span></span></button>{index < steps.length - 1 ? <span className="absolute left-[11px] top-6 h-[calc(100%-24px)] w-px bg-border" /> : null}</li>)}</ol></aside>;
}

function TemplateSelector({ query, setQuery, templates, selected, onSelect }: { query: string; setQuery: (value: string) => void; templates: GoalTemplate[]; selected: string; onSelect: (template: GoalTemplate) => void }) {
  return <div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} className="h-9 pl-9" placeholder="Search goal templates" /></div><div className="mt-4 grid gap-px overflow-hidden border border-border md:grid-cols-3">{templates.map(template => { const Icon = template.icon; const active = selected === template.id; return <button key={template.id} type="button" onClick={() => onSelect(template)} className={cn('relative min-h-32 bg-background p-4 text-left transition-colors hover:bg-slate-900/50', active && 'bg-blue-950/35 ring-1 ring-inset ring-blue-500')}><div className="flex items-start justify-between"><Icon className={cn('h-5 w-5', active ? 'text-blue-300' : 'text-muted-foreground')} />{active ? <CheckCircle2 className="h-4 w-4 text-blue-400" /> : null}</div><p className="mt-3 text-[9px] font-bold uppercase tracking-[.1em] text-blue-400">{template.category}</p><p className="mt-1 text-xs font-bold leading-4">{template.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{template.description}</p></button>})}</div>{templates.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No templates match your search.</p> : null}</div>;
}

function Field({ label, required, children, helper }: { label: string; required?: boolean; children: React.ReactNode; helper?: string }) { return <label className="block"><span className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-400">*</span> : null}</span><span className="mt-2 block">{children}</span>{helper ? <span className="mt-1 block text-[11px] text-muted-foreground">{helper}</span> : null}</label>; }
const fieldClass = 'h-10 w-full border border-input bg-transparent px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

function BasicsForm({ title, setTitle, description, setDescription, employeeName, manager, startDate, setStartDate, dueDate, setDueDate, goalScope, setGoalScope }: { title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; employeeName: string; manager: string; startDate: string; setStartDate: (value: string) => void; dueDate: string; setDueDate: (value: string) => void; goalScope: 'individual' | 'team'; setGoalScope: (value: 'individual' | 'team') => void }) {
  return <div className="space-y-5"><Field label="Goal title" required><Input value={title} maxLength={120} onChange={event => setTitle(event.target.value)} /><span className="mt-1 block text-right text-[11px] text-muted-foreground">{title.length}/120</span></Field><Field label="Goal description" required><textarea value={description} maxLength={500} onChange={event => setDescription(event.target.value)} rows={4} className="w-full resize-none border border-input bg-transparent p-3 text-sm leading-6 outline-none focus:border-blue-500" /><span className="mt-1 block text-right text-[11px] text-muted-foreground">{description.length}/500</span></Field><Field label="Goal type" required helper="A measurable outcome that contributes to business results."><select value={goalScope} onChange={event=>setGoalScope(event.target.value as 'individual'|'team')} className={fieldClass}><option value="individual">Performance goal</option><option value="team">Team performance goal</option></select></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Employee owner" required><div className={`${fieldClass} flex items-center gap-2`}><Avatar className="h-6 w-6"><AvatarFallback className="bg-slate-800 text-[10px]">{employeeName.split(/\s+/).map(value=>value[0]).join('').slice(0,2)}</AvatarFallback></Avatar><span>{employeeName}</span></div></Field><Field label="Manager" required><div className={`${fieldClass} flex items-center gap-2`}><Avatar className="h-6 w-6"><AvatarFallback className="bg-slate-800 text-[10px]">{manager.split(/\s+/).map(value=>value[0]).join('').slice(0,2)}</AvatarFallback></Avatar><span>{manager}</span></div></Field></div><Field label="Performance period" required><select className={`${fieldClass} max-w-xs`} defaultValue="fy2026"><option value="fy2026">FY2026 (Jan 1 – Dec 31, 2026)</option><option value="h2">H2 2026 (Jul 1 – Dec 31, 2026)</option></select></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Start date" required><Input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></Field><Field label="Due date" required><Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></Field></div></div>;
}

function MeasuresForm({ metric, setMetric, baseline, setBaseline, target, setTarget, unit, setUnit, weight, setWeight, cadence, setCadence, milestones, setMilestones }: { metric: string; setMetric: (value: string) => void; baseline: string; setBaseline: (value: string) => void; target: string; setTarget: (value: string) => void; unit: string; setUnit: (value: string) => void; weight: string; setWeight: (value: string) => void; cadence: string; setCadence: (value: string) => void; milestones: Array<{date:string;target:string;note:string}>; setMilestones: React.Dispatch<React.SetStateAction<Array<{date:string;target:string;note:string}>>> }) {
  const updateMilestone = (index: number, field: 'date' | 'target' | 'note', value: string) => setMilestones(rows => rows.map((row, rowIndex) => rowIndex === index ? {...row, [field]: value} : row));
  return <div className="space-y-5"><Field label="Success metric" required helper="Choose the single measure that best proves the outcome."><Input value={metric} onChange={event => setMetric(event.target.value)} placeholder="e.g. Qualified opportunities" /></Field><div className="grid gap-4 md:grid-cols-3"><Field label="Baseline" required><Input value={baseline} onChange={event => setBaseline(event.target.value)} /></Field><Field label="Target" required><Input value={target} onChange={event => setTarget(event.target.value)} /></Field><Field label="Unit"><Input value={unit} onChange={event => setUnit(event.target.value)} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Weight" required helper="Relative importance of this goal"><div className="relative"><Input type="number" min="0" max="100" value={weight} onChange={event => setWeight(event.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div></Field><Field label="Review cadence" required><select value={cadence} onChange={event => setCadence(event.target.value)} className={fieldClass}><option>Weekly</option><option>Biweekly</option><option>Monthly</option><option>Quarterly</option></select></Field></div><div className="border-t border-border pt-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Milestones</p><p className="mt-1 text-xs text-muted-foreground">Define target checkpoints for the goal period.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setMilestones(rows => [...rows,{date:'2026-12-18',target:'',note:''}])}>Add milestone</Button></div><div className="mt-3 space-y-2">{milestones.map((row,index)=><div key={`${index}-${row.date}`} className="grid gap-2 md:grid-cols-[150px_100px_minmax(0,1fr)]"><Input type="date" value={row.date} onChange={event=>updateMilestone(index,'date',event.target.value)} /><Input value={row.target} aria-label={`Milestone ${index+1} target`} onChange={event=>updateMilestone(index,'target',event.target.value)} placeholder="Target" /><Input value={row.note} aria-label={`Milestone ${index+1} note`} onChange={event=>updateMilestone(index,'note',event.target.value)} placeholder="Note (optional)" /></div>)}</div></div><div className="border border-blue-900 bg-blue-950/25 p-4"><p className="flex items-center gap-2 text-sm font-bold text-blue-200"><Gauge className="h-4 w-4" />Measure preview</p><p className="mt-2 text-sm text-muted-foreground">Move <strong className="text-foreground">{metric || 'your metric'}</strong> from <strong className="text-foreground">{baseline || '—'}</strong> to <strong className="text-foreground">{target || '—'} {unit}</strong>.</p></div></div>;
}

function AlignmentForm({ priority, setPriority }: { priority: string; setPriority: (value: string) => void }) {
  return <div><Field label="Company priority" required><select value={priority} onChange={event => setPriority(event.target.value)} className={fieldClass}><option>Grow enterprise revenue</option><option>Improve customer retention</option><option>Build a high-performing team</option><option>Increase operational efficiency</option></select></Field><div className="mt-6 divide-y divide-border border-y border-border"><div className="flex items-center gap-4 py-4"><Building2 className="h-5 w-5 text-blue-400" /><div><p className="text-xs text-muted-foreground">Company priority</p><p className="text-sm font-bold">{priority}</p></div></div><div className="flex items-center gap-4 py-4 pl-8"><Target className="h-5 w-5 text-blue-400" /><div><p className="text-xs text-muted-foreground">Sales objective</p><p className="text-sm font-bold">Improve pipeline quality</p></div></div><div className="flex items-center gap-4 py-4 pl-16"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><p className="text-xs text-muted-foreground">Employee goal</p><p className="text-sm font-bold">Aligned and ready</p></div></div></div></div>;
}

function ScheduleForm({ cadence, setCadence, dueDate }: { cadence: string; setCadence: (value: string) => void; dueDate: string }) {
  return <div><Field label="Review cadence" required><select value={cadence} onChange={event => setCadence(event.target.value)} className={fieldClass}><option>Weekly</option><option>Biweekly</option><option>Monthly</option><option>Quarterly</option></select></Field><div className="mt-6 border border-border"><div className="border-b border-border px-4 py-3 text-sm font-bold">Planned reviews</div>{['Sep 18, 2026','Oct 16, 2026','Nov 20, 2026',new Date(`${dueDate}T00:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})].map((date, index) => <div key={`${date}-${index}`} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"><CalendarDays className="h-4 w-4 text-blue-400" /><span className="text-sm">{date}</span><span className="ml-auto text-xs text-muted-foreground">{index === 3 ? 'Final review' : 'Progress review'}</span></div>)}</div></div>;
}

function ReviewGoal({ title, description, metric, baseline, target, unit, priority, cadence, employeeName, startDate, dueDate, weight, goalScope, milestones }: { title: string; description: string; metric: string; baseline: string; target: string; unit: string; priority: string; cadence: string; employeeName: string; startDate: string; dueDate: string; weight: string; goalScope: 'individual' | 'team'; milestones: Array<{date:string;target:string;note:string}> }) {
  const rows = [['Goal type', goalScope === 'individual' ? 'Individual goal' : 'Team goal'], ['Owner', employeeName], ['Success metric', metric], ['Baseline', `${baseline} ${unit}`], ['Target', `${target} ${unit}`], ['Weight', `${weight}%`], ['Alignment', priority], ['Review cadence', cadence], ['Timeline', `${startDate} – ${dueDate}`], ['Milestones', `${milestones.length} checkpoints`]]; return <div><div className="border border-border p-5"><p className="text-lg font-bold">{title || 'Untitled goal'}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{description || 'No description added.'}</p><dl className="mt-5 grid gap-px overflow-hidden border border-border sm:grid-cols-2">{rows.map(([label,value]) => <div key={label} className="bg-background p-3"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold">{value || 'Not set'}</dd></div>)}</dl></div><div className="mt-4 flex gap-3 border border-emerald-900 bg-emerald-950/25 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /><div><p className="text-sm font-bold text-emerald-200">Ready to create</p><p className="mt-1 text-xs leading-5 text-emerald-300/80">The goal is measurable, time-bound, aligned, actionable, and includes a milestone review plan.</p></div></div></div>;
}

function GoalPreview({ employeeName, manager, title, description, metric, baseline, target, unit, priority, cadence, startDate, dueDate, template, weight, goalScope, milestones }: { employeeName: string; manager: string; title: string; description: string; metric: string; baseline: string; target: string; unit: string; priority: string; cadence: string; startDate: string; dueDate: string; template: GoalTemplate; weight: string; goalScope: 'individual' | 'team'; milestones: Array<{date:string;target:string;note:string}> }) {
  const initials = employeeName.split(/\s+/).map(value => value[0]).join('').slice(0,2).toUpperCase();
  const baselineNumber = Number(baseline); const targetNumber = Number(target); const lift = baselineNumber > 0 && targetNumber > baselineNumber ? `+${Math.round((targetNumber-baselineNumber)/baselineNumber*1000)/10}%` : '—';
  return <aside className="min-w-0 border-l border-border px-4 py-5 2xl:px-5 2xl:py-6"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-blue-400 2xl:text-xs">Alignment & summary</p><p className="mt-1 text-[11px] text-muted-foreground">Live summary of your goal</p><div className="mt-5 space-y-5"><div><p className="text-xs font-semibold">Outcome</p><p className="mt-2 text-sm font-bold leading-5">{title || 'Add a goal title'}</p><p className="mt-2 line-clamp-3 text-[11px] leading-5 text-muted-foreground 2xl:text-xs">{description || template.description}</p></div><div><p className="text-xs font-semibold">Goal summary</p><dl className="mt-2 space-y-1.5 text-[11px]"><SummaryValue label="Type" value={goalScope === 'individual' ? 'Individual goal' : 'Team goal'} /><SummaryValue label="Success metric" value={metric || 'Not set'} /><SummaryValue label="Baseline" value={`${baseline || '—'} ${unit}`} /><SummaryValue label="Target" value={`${target || '—'} ${unit}`} /><SummaryValue label="Target lift" value={lift} positive /><SummaryValue label="Weight" value={`${weight}%`} /><SummaryValue label="Review cadence" value={cadence} /><SummaryValue label="Milestones" value={`${milestones.length}`} /></dl></div><div><p className="text-xs font-semibold">Ownership</p><div className="mt-3 flex items-center gap-2"><Avatar className="h-7 w-7 shrink-0 border border-border"><AvatarFallback className="bg-slate-800 text-[10px]">{initials}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-xs font-semibold">{employeeName}</p><p className="truncate text-[10px] text-muted-foreground">Manager: {manager}</p></div></div></div><PreviewRow icon={CalendarDays} label="Goal period" value={`${formatDate(startDate)} – ${formatDate(dueDate)}`} /><PreviewRow icon={Building2} label="Alignment" value={priority} /><div className="border-t border-border pt-4"><p className="text-xs font-semibold">Readiness checks</p><div className="mt-3 space-y-2">{['Measurable','Time-bound','Aligned','Actionable'].map(item=><p key={item} className="flex items-center gap-2 text-[11px] text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />{item}</p>)}</div></div></div><div className="mt-6 border-t border-border pt-4"><p className="flex items-start gap-2 text-[10px] leading-4 text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Visible to employee, manager, and relevant stakeholders after creation.</p></div></aside>;
}

function SummaryValue({label,value,positive=false}:{label:string;value:string;positive?:boolean}) { return <div className="flex gap-2"><dt className="min-w-20 text-muted-foreground">{label}</dt><dd className={cn('min-w-0 flex-1 text-right font-semibold',positive&&value!=='—'&&'text-emerald-400')}>{value}</dd></div>; }

function PreviewRow({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) { return <div className="flex min-w-0 gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><div className="min-w-0"><p className="text-[10px] text-muted-foreground 2xl:text-xs">{label}</p><p className="mt-1 text-xs font-semibold leading-4 2xl:text-sm">{value}</p></div></div>; }
function formatDate(value: string) { if (!value) return 'Not set'; return new Date(`${value}T00:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
