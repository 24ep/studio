"use client";

import * as React from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronRight, CircleAlert, FileCheck2, Info, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { cn } from '@/lib/utils';

type ActionName = 'check-in' | 'feedback' | 'recognition' | 'development' | 'evidence';

const competencyRows = [
  { name: 'Client Relationship', category: 'Customer impact', required: 4, self: 4, manager: 4, evidence: 5 },
  { name: 'Communication', category: 'Core capability', required: 4, self: 3, manager: 3, evidence: 3 },
  { name: 'Sales Execution', category: 'Role capability', required: 5, self: 4, manager: 4, evidence: 4 },
  { name: 'Problem Solving', category: 'Core capability', required: 4, self: 3, manager: 3, evidence: 2 },
  { name: 'Collaboration', category: 'Core capability', required: 4, self: 4, manager: 4, evidence: 4 },
  { name: 'Strategic Thinking', category: 'Leadership capability', required: 4, self: 2, manager: 3, evidence: 2 },
];

const behaviorLevels = [
  ['5', 'Expert', 'Shapes long-term strategy and influences direction across the organization.'],
  ['4', 'Advanced', 'Evaluates multiple scenarios and recommends strategies that drive business impact.'],
  ['3', 'Proficient', 'Analyzes trends and connects insights to support planning and decision-making.'],
  ['2', 'Emerging', 'Identifies patterns with guidance and begins to consider future impact.'],
  ['1', 'Foundational', 'Understands immediate tasks with limited consideration of broader context.'],
];

const evidenceByCompetency: Record<string, Array<{title:string; source:string; role:string; date:string}>> = {
  'Strategic Thinking': [
    { title: 'Q3 Account Growth Plan', source: 'Ben Thompson', role: 'Engineering Manager', date: 'Jul 18, 2026' },
    { title: 'Market Expansion Analysis', source: 'Lina Patel', role: 'Customer Success Manager', date: 'Jun 30, 2026' },
  ],
  Communication: [
    { title: 'Executive customer presentation', source: 'Arun Sombat', role: 'Account Executive', date: 'Aug 2, 2026' },
    { title: 'Renewal negotiation summary', source: 'Lina Patel', role: 'Customer Success Manager', date: 'Jul 21, 2026' },
  ],
};

export function PerformanceCompetencyMatrix({ data, onAction }: { data: PerformanceWorkspaceData; onAction:(action:ActionName)=>void }) {
  const [selected, setSelected] = React.useState('Strategic Thinking');
  const [period, setPeriod] = React.useState('FY2026');
  const selectedRow = competencyRows.find(row => row.name === selected) ?? competencyRows[5];
  const evidence = evidenceByCompetency[selected] ?? [
    { title: `${selected} work example`, source: 'Ben Thompson', role: 'Engineering Manager', date: 'Jul 15, 2026' },
    { title: 'Quarterly performance feedback', source: data.selectedEmployee?.name ?? 'Anucha Prom', role: data.selectedEmployee?.jobTitle ?? 'Sales Executive', date: 'Jun 28, 2026' },
  ];
  const gap = selectedRow.required - selectedRow.manager;

  return <section className="min-h-[680px] bg-background">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-4">
      <div><h2 className="text-base font-bold">Competency Matrix &amp; Drilldown</h2><p className="mt-1 text-xs text-muted-foreground">Assess competencies against the required level for the role.</p></div>
      <div className="flex items-end gap-2"><label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Assessment period<select aria-label="Assessment period" value={period} onChange={event=>setPeriod(event.target.value)} className="h-9 min-w-48 border border-border bg-background px-3 text-xs font-medium text-foreground"><option>FY2026</option><option>FY2025</option><option>Current cycle</option></select></label><Button className="h-9 bg-[#19469b] text-white hover:bg-[#153b84]" onClick={()=>toast.success(`${period} assessment updated`)}>Update assessment</Button></div>
    </header>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
      <main className="min-w-0 border-r border-border">
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-[190px_repeat(3,125px)_70px_55px_minmax(125px,1fr)] border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground"><span>Competency</span><span>Required level</span><span>Self rating</span><span>Manager rating</span><span>Evidence</span><span>Gap</span><span>Status</span></div>
            {competencyRows.map(row => {
              const rowGap = row.required - row.manager;
              return <button type="button" key={row.name} onClick={()=>setSelected(row.name)} className={cn('grid w-full rounded-none grid-cols-[190px_repeat(3,125px)_70px_55px_minmax(125px,1fr)] items-center border-b border-border px-4 py-4 text-left text-xs transition-colors hover:bg-muted/40',selected===row.name&&'border-l-2 border-l-blue-600 bg-blue-50 dark:bg-blue-950/35')}>
                <span className="flex items-center gap-2 font-semibold"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />{row.name}<Info className="h-3 w-3 text-muted-foreground" /></span>
                <Level value={row.required} /><Level value={row.self} /><Level value={row.manager} />
                <strong>{row.evidence}</strong><strong className={rowGap ? 'text-amber-600' : 'text-emerald-600'}>{rowGap ? `-${rowGap}` : '0'}</strong>
                <span className={cn('flex items-center gap-2 font-medium',rowGap>=2?'text-red-600':rowGap===1?'text-amber-600':'text-emerald-600')}>{rowGap>=2?<CircleAlert className="h-3.5 w-3.5"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}{rowGap>=2?'Needs focus':rowGap===1?'Development area':'On track'}</span>
              </button>;
            })}
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-[10px] text-muted-foreground"><span>Showing 1 to 6 of 6 competencies</span><span className="flex gap-4"><i className="not-italic text-emerald-600">● On track (gap 0)</i><i className="not-italic text-amber-600">● Development area (gap -1)</i><i className="not-italic text-red-600">● Needs focus (gap ≤ -2)</i></span></footer>
      </main>
      <aside className="px-5 py-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{selected}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedRow.category}. Applies insight and perspective to make decisions that improve long-term outcomes.</p></div><Target className="mt-1 h-5 w-5 shrink-0 text-blue-500" /></div>
        <h4 className="mt-5 text-xs font-bold">Current vs Expected</h4><div className="mt-3 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-xs"><Rating label="Self rating" value={selectedRow.self}/><Rating label="Manager rating" value={selectedRow.manager}/><Rating label="Required" value={selectedRow.required}/></div>
        <div className="mt-5"><h4 className="text-xs font-bold">Observable behaviors by level</h4><div className="mt-2 divide-y divide-border border-y border-border">{behaviorLevels.map(([level,name,description])=><div key={level} className={cn('grid grid-cols-[22px_65px_1fr] gap-2 py-2 text-[10px] leading-4',Number(level)===selectedRow.self&&'bg-blue-50 px-2 dark:bg-blue-950/35')}><strong>{level}</strong><span className="text-muted-foreground">{name}</span><span>{description}</span></div>)}</div></div>
        <div className="mt-5 flex items-center justify-between"><h4 className="text-xs font-bold">Evidence ({evidence.length})</h4><button type="button" onClick={()=>onAction('evidence')} className="text-[10px] font-semibold text-blue-500">View all</button></div>
        <div className="mt-2 divide-y divide-border border-y border-border">{evidence.map(item=><button type="button" key={item.title} onClick={()=>toast(item.title)} className="flex w-full items-start gap-2 py-3 text-left"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"/><span className="min-w-0"><strong className="block truncate text-xs">{item.title}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{item.source} · {item.role}</span><span className="block text-[10px] text-muted-foreground">{item.date}</span></span></button>)}</div>
        {gap>0&&<p className="mt-4 text-xs leading-5 text-amber-600">A {gap}-level gap remains between the manager rating and role expectation.</p>}
        <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={()=>onAction('evidence')}>Add evidence</Button><Button size="sm" className="bg-[#19469b] text-white hover:bg-[#153b84]" onClick={()=>onAction('development')}>Create development action</Button></div>
      </aside>
    </div>
  </section>;
}

function Level({value}:{value:number}) { return <span className="flex items-center gap-2"><span className="flex gap-0.5">{[1,2,3,4,5].map(step=><i key={step} className={cn('h-2 w-3 not-italic',step<=value?'bg-blue-600':'bg-muted')} />)}</span><strong>{value}</strong></span>; }
function Rating({label,value}:{label:string;value:number}) { return <span className="px-3"><small className="block text-[9px] text-muted-foreground">{label}</small><strong className="mt-1 block text-base">{value}</strong><span className="text-[9px] text-blue-500">{['','Foundational','Emerging','Proficient','Advanced','Expert'][value]}</span></span>; }
