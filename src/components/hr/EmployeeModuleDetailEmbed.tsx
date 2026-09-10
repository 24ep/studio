"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, ArrowTopRightOnSquareIcon, BookOpenIcon, CalendarDaysIcon, ChartBarIcon, ClockIcon, Cog6ToothIcon, WalletIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { HrisEmptyState, HrisStatusBadge } from '@/components/hris/HrisWorkspacePrimitives';

type DetailModule = 'Onboarding' | 'Leave' | 'Attendance' | 'Learning' | 'Performance' | 'Payroll';
type DetailItem = { id:string; module:string; title:string; status:string; occurredAt:string; details:Record<string,unknown> };

type ModuleMeta = { path:string; configPath:string; description:string; configuredBy:string; icon:typeof CalendarDaysIcon; recordParam:string; columns:Array<[string,string]> };

const moduleMeta: Record<DetailModule, ModuleMeta> = {
  Onboarding: { path:'/people/onboarding', configPath:'/settings?adminTab=hr-setup&config=onboarding', description:'Journey progress, completed steps, and onboarding milestones for this employee.', configuredBy:'Onboarding templates', icon:CalendarDaysIcon, recordParam:'onboardingId', columns:[['completedAt','Completed']] },
  Leave: { path:'/workforce/leave', configPath:'/settings/leave-policies', description:'Requests follow the assigned leave policy, allowance, and approval rules.', configuredBy:'Leave policies', icon:CalendarDaysIcon, recordParam:'requestId', columns:[['startDate','Start date'],['endDate','End date'],['units','Days'],['decidedAt','Decision']] },
  Attendance: { path:'/workforce/attendance?view=attendance', configPath:'/settings/policy-configuration?area=workforce', description:'Attendance is evaluated against the employee schedule and workforce thresholds.', configuredBy:'Schedules & workforce policy', icon:ClockIcon, recordParam:'recordId', columns:[['scheduleName','Schedule'],['checkIn','Check in'],['checkOut','Check out'],['lateMinutes','Late']] },
  Learning: { path:'/learning', configPath:'/settings/policy-configuration?area=performance-learning', description:'Assignments reflect configured courses, due dates, and learning policy.', configuredBy:'Learning policy & taxonomy', icon:BookOpenIcon, recordParam:'enrollmentId', columns:[['progress','Progress'],['dueDate','Due'],['completedAt','Completed']] },
  Performance: { path:'/workforce/performance', configPath:'/settings/policy-configuration?area=performance-learning', description:'Reviews follow their configured cycle, rating model, and acknowledgment workflow.', configuredBy:'Performance policy', icon:ChartBarIcon, recordParam:'reviewId', columns:[['overallRating','Overall rating'],['submittedAt','Submitted'],['acknowledgmentStatus','Acknowledgment']] },
  Payroll: { path:'/payroll', configPath:'/settings/policy-configuration?area=payroll-expenses', description:'Results follow the payroll period, calculation inputs, and approval configuration.', configuredBy:'Payroll policy & approvals', icon:WalletIcon, recordParam:'runItemId', columns:[['grossPay','Gross pay'],['totalDeductions','Deductions'],['netPay','Net pay'],['variancePercent','Variance']] },
};

function appendParams(path:string, params:Record<string,string>){
  const [pathname, query=''] = path.split('?');
  const search = new URLSearchParams(query);
  Object.entries(params).forEach(([key,value])=>search.set(key,value));
  return `${pathname}?${search.toString()}`;
}

export function EmployeeModuleDetailEmbed({ employeeId, module }: { employeeId:string; module:DetailModule }) {
  const [items,setItems]=React.useState<DetailItem[]>([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const meta=moduleMeta[module];
  const Icon=meta.icon;
  const sourceHref=appendParams(meta.path,{employeeId});

  React.useEffect(()=>{
    let active=true; setLoading(true); setError('');
    void fetch(`/api/hr/v1/employees/${employeeId}/timeline?module=${encodeURIComponent(module)}`,{cache:'no-store'})
      .then(async response=>{const body=await response.json(); if(!response.ok) throw new Error(body?.error?.message||`Unable to load ${module.toLowerCase()} details.`); if(active)setItems(body.data||[]);})
      .catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'Unable to load employee records.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[employeeId,module]);

  const completed=items.filter(item=>['completed','approved','paid','present'].includes(String(item.status).toLowerCase())).length;
  const attention=items.filter(item=>['rejected','overdue','failed','absent','at_risk'].includes(String(item.status).toLowerCase())).length;

  return <section className="min-h-[560px] bg-background">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4"><div className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 text-primary"/><div><div className="mb-1 flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">{module} summary</h2><span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Connected module · read only</span></div><p className="max-w-2xl text-sm text-muted-foreground">{meta.description} This Employee view reads the source records; workflow changes remain in the owning {module} workspace.</p><p className="mt-2 text-xs font-medium text-primary">Configured by: {meta.configuredBy}</p></div></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href={meta.configPath}><Cog6ToothIcon className="mr-2 h-4 w-4"/>View configuration</Link></Button><Button asChild size="sm"><Link href={sourceHref}>Open {module} workspace <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4"/></Link></Button></div></header>
    <div className="grid grid-cols-3 divide-x divide-border border-b border-border"><Metric label="Source records" value={items.length}/><Metric label="Completed" value={completed}/><Metric label="Needs attention" value={attention} warning={attention>0}/></div>
    {loading?<div className="m-5 h-64 animate-pulse bg-muted/35" aria-label={`Loading ${module} details`}/>:error?<div role="alert" className="m-5 border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</div>:items.length===0?<HrisEmptyState title={`No ${module.toLowerCase()} records`} description={`No source ${module.toLowerCase()} activity is recorded for this employee yet.`}/>:<div className="overflow-x-auto"><div className="min-w-[820px]"><div className="grid border-b border-border bg-muted/25 px-5 py-2 text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground" style={{gridTemplateColumns:`minmax(210px,1.4fr) 110px 110px repeat(${meta.columns.length}, minmax(120px,1fr)) 36px`}}><span>Source record</span><span>Date</span><span>Status</span>{meta.columns.map(([,label])=><span key={label}>{label}</span>)}<span className="sr-only">Open</span></div>{items.map(item=>{const recordHref=appendParams(meta.path,{employeeId,[meta.recordParam]:item.id});return <Link href={recordHref} key={item.id} className="grid items-center border-b border-border px-5 py-4 text-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" style={{gridTemplateColumns:`minmax(210px,1.4fr) 110px 110px repeat(${meta.columns.length}, minmax(120px,1fr)) 36px`}}><span className="min-w-0"><strong className="block truncate">{item.title}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">Open in {module}</span></span><span className="text-xs">{formatValue(item.occurredAt,'date')}</span><HrisStatusBadge value={item.status}/>{meta.columns.map(([key])=><span key={key} className="truncate text-xs">{formatValue(item.details?.[key],key)}</span>)}<ArrowRightIcon className="h-4 w-4 text-muted-foreground"/></Link>})}</div></div>}
  </section>;
}

function Metric({label,value,warning=false}:{label:string;value:number;warning?:boolean}){return <div className="px-5 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className={warning?'mt-1 text-xl font-semibold text-amber-600':'mt-1 text-xl font-semibold'}>{value}</p></div>;}
function formatValue(value:unknown,key:string){if(value===null||value===undefined||value==='')return '—'; if(key.toLowerCase().includes('pay'))return new Intl.NumberFormat('en-US',{style:'currency',currency:'THB',maximumFractionDigits:0}).format(Number(value)||0); if(key==='progress')return `${Number(value)||0}%`; if(key==='checkIn'||key==='checkOut'){const time=new Date(String(value));return Number.isNaN(time.getTime())?String(value):time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});} if(key.toLowerCase().includes('date')||key.toLowerCase().includes('at')||key==='date'){const date=new Date(String(value));return Number.isNaN(date.getTime())?String(value):date.toLocaleDateString();} return String(value);}
