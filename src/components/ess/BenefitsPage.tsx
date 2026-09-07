"use client";

import * as React from 'react';
import { CheckCircleIcon, HeartIcon, PlusIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { employeeBenefitActions, type BenefitAction } from '@/lib/hr/benefit-lifecycle';

type Plan = { id: string; name: string; type: string; description?: string | null; employeeCost: string | number; employerCost: string | number; providerCode?: string | null };
type Enrollment = { id: string; benefitPlanId: string; status: string; version: number; effectiveFrom?: string | null; effectiveTo?: string | null; endedAt?: string | null; evidence?: unknown; benefitPlan: Plan };
type Payload = { employee: { name: string }; plans: Plan[]; enrollments: Enrollment[] };
type Dependent = { name: string; relationship: string };

type BenefitDecisionNote = { action?: string; comment?: string; createdAt?: string; toStatus?: string };

const money = (value: string | number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Number(value || 0));
const actionLabel: Record<Extract<BenefitAction, 'withdraw' | 'resubmit' | 'request_termination'>, string> = {
  withdraw: 'Withdraw application',
  resubmit: 'Resubmit application',
  request_termination: 'Request coverage termination',
};

function latestDecisionNote(evidence: unknown): BenefitDecisionNote | null {
  if (!Array.isArray(evidence)) return null;
  for (let index = evidence.length - 1; index >= 0; index -= 1) {
    const value = evidence[index];
    if (!value || typeof value !== 'object') continue;
    const record = value as Record<string, unknown>;
    if (record.kind !== 'decision') continue;
    return {
      action: typeof record.action === 'string' ? record.action : undefined,
      comment: typeof record.comment === 'string' ? record.comment : undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
      toStatus: typeof record.toStatus === 'string' ? record.toStatus : undefined,
    };
  }
  return null;
}

export function BenefitsPage() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Plan | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [actionBusy, setActionBusy] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ effectiveFrom: '', lifeEventType: 'new_enrollment' });
  const [dependents, setDependents] = React.useState<Dependent[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { const response = await fetch('/api/ess/benefits', { cache: 'no-store' }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Unable to load benefits.'); setData(payload.data); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load benefits.'); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function apply() {
    if (!selected || !form.effectiveFrom) return;
    if (dependents.some(item => item.name.trim().length < 2 || item.relationship.trim().length < 2)) return toast.error('Complete each dependent name and relationship.');
    setSaving(true);
    try { const response = await fetch('/api/ess/benefits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ benefitPlanId: selected.id, ...form, dependents }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Unable to apply.'); toast.success('Benefit application submitted'); setSelected(null); setDependents([]); setForm({ effectiveFrom: '', lifeEventType: 'new_enrollment' }); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to apply.'); }
    finally { setSaving(false); }
  }

  async function act(enrollment: Enrollment, action: Extract<BenefitAction, 'withdraw' | 'resubmit' | 'request_termination'>) {
    if (action === 'request_termination' && !window.confirm('Send a request to end this benefit coverage? Coverage remains active until the request is approved.')) return;
    setActionBusy(enrollment.id);
    try {
      const response = await fetch('/api/ess/benefits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enrollment.id, action, expectedVersion: enrollment.version }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update this benefit application.');
      toast.success(action === 'withdraw' ? 'Benefit application withdrawn.' : action === 'resubmit' ? 'Benefit application resubmitted.' : 'Termination request submitted.');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update this benefit application.');
    } finally {
      setActionBusy(null);
    }
  }

  const enrollmentFor = (planId: string) => data?.enrollments.find(item => item.benefitPlanId === planId && !['ended', 'cancelled'].includes(item.status));
  return <main className="min-h-full bg-muted/10 p-4 sm:p-6"><div className="mx-auto max-w-6xl">
    <header className="border-b border-border pb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">ESS · compensation & care</p><h1 className="mt-2 text-3xl font-bold tracking-tight">My benefits</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Compare available plans, request coverage, and track approval or termination through to the final state.</p></header>
    {loading ? <p className="py-16 text-center text-sm text-muted-foreground">Loading available benefits…</p> : !data ? <p className="py-16 text-center text-sm text-destructive">Benefits are currently unavailable.</p> : <>
      <section className="grid gap-px overflow-hidden border-x border-b border-border bg-border sm:grid-cols-3"><Summary icon={ShieldCheckIcon} value={data.plans.length} label="Available plans" /><Summary icon={CheckCircleIcon} value={data.enrollments.filter(item => item.status === 'active').length} label="Active benefits" /><Summary icon={HeartIcon} value={data.enrollments.filter(item => ['pending_approval', 'pending_termination'].includes(item.status)).length} label="Pending review" /></section>
      <section className="mt-8"><div><h2 className="text-lg font-semibold">Available to you</h2><p className="mt-1 text-sm text-muted-foreground">Costs shown are monthly estimates configured by Payroll.</p></div>
        {data.plans.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{data.plans.map(plan => { const enrollment = enrollmentFor(plan.id); return <article key={plan.id} className="flex flex-col border border-border bg-background p-5"><div className="flex items-start justify-between gap-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><HeartIcon className="h-5 w-5" /></div><Badge variant={enrollment?.status === 'active' ? 'success' : 'secondary'}>{enrollment ? enrollment.status.replace(/_/g, ' ') : plan.type.replace(/_/g, ' ')}</Badge></div><h3 className="mt-5 text-lg font-bold">{plan.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{plan.description || 'Coverage details are available from the People team.'}</p><div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4"><div><p className="text-xs text-muted-foreground">Your contribution</p><p className="mt-1 font-bold">{money(plan.employeeCost)}<span className="text-xs font-normal text-muted-foreground"> / month</span></p></div><div><p className="text-xs text-muted-foreground">Employer contribution</p><p className="mt-1 font-bold">{money(plan.employerCost)}<span className="text-xs font-normal text-muted-foreground"> / month</span></p></div></div><Button className="mt-5" variant={enrollment ? 'outline' : 'default'} disabled={Boolean(enrollment)} onClick={() => setSelected(plan)}>{enrollment ? `Application ${enrollment.status.replace(/_/g, ' ')}` : 'Apply for this benefit'}</Button></article>; })}</div> : <div className="mt-4 border border-dashed border-border bg-background p-10 text-center"><HeartIcon className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">No plans are open</h3><p className="mt-1 text-sm text-muted-foreground">New benefit plans will appear here when Payroll makes them available.</p></div>}
      </section>
      {data.enrollments.length ? <section className="mt-9"><h2 className="text-lg font-semibold">Application & coverage history</h2><div className="mt-3 divide-y divide-border border-y border-border bg-background">{data.enrollments.map(item => { const actions = employeeBenefitActions(item.status).filter((action): action is Extract<BenefitAction, 'withdraw' | 'resubmit' | 'request_termination'> => ['withdraw', 'resubmit', 'request_termination'].includes(action)); const decision = latestDecisionNote(item.evidence); return <div key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-semibold">{item.benefitPlan?.name || 'Benefit plan'}</p><p className="mt-1 text-xs text-muted-foreground">Coverage from {item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : 'approval date'}{item.effectiveTo ? ` · through ${new Date(item.effectiveTo).toLocaleDateString()}` : ''}</p>{decision?.comment ? <div className="mt-2 rounded-md border border-border bg-muted/30 px-3 py-2"><p className="text-xs font-semibold capitalize">Reviewer note · {String(decision.action || decision.toStatus || 'decision').replace(/_/g, ' ')}</p><p className="mt-1 text-sm text-muted-foreground">{decision.comment}</p></div> : null}</div><div className="flex flex-wrap items-center gap-2 sm:justify-end"><Badge variant={item.status === 'active' ? 'success' : 'secondary'}>{item.status.replace(/_/g, ' ')}</Badge>{actions.map(action => <Button key={action} size="sm" variant={action === 'request_termination' ? 'outline' : 'secondary'} disabled={actionBusy === item.id} onClick={() => void act(item, action)}>{actionBusy === item.id ? 'Updating…' : actionLabel[action]}</Button>)}</div></div>; })}</div></section> : null}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Apply for {selected?.name}</DialogTitle><DialogDescription>Your request will be reviewed before coverage or payroll deductions begin.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><Field label="Requested coverage date"><Input type="date" min={new Date().toISOString().slice(0, 10)} value={form.effectiveFrom} onChange={event => setForm(current => ({ ...current, effectiveFrom: event.target.value }))} /></Field><Field label="Enrollment reason"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.lifeEventType} onChange={event => setForm(current => ({ ...current, lifeEventType: event.target.value }))}>{[['new_enrollment','New enrollment'],['marriage','Marriage'],['birth_or_adoption','Birth or adoption'],['loss_of_coverage','Loss of coverage'],['other','Other qualifying event']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div><div className="flex items-center justify-between"><Label>Dependents (optional)</Label><Button type="button" variant="ghost" size="sm" onClick={() => setDependents(current => [...current, { name: '', relationship: '' }])}><PlusIcon className="mr-1 h-4 w-4" />Add</Button></div><div className="mt-2 space-y-2">{dependents.map((dependent, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input aria-label={`Dependent ${index + 1} name`} placeholder="Full name" value={dependent.name} onChange={event => setDependents(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><Input aria-label={`Dependent ${index + 1} relationship`} placeholder="Relationship" value={dependent.relationship} onChange={event => setDependents(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, relationship: event.target.value } : item))} /><Button type="button" variant="ghost" size="icon" aria-label="Remove dependent" onClick={() => setDependents(current => current.filter((_, itemIndex) => itemIndex !== index))}>×</Button></div>)}</div></div></div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button disabled={saving || !form.effectiveFrom} onClick={() => void apply()}>{saving ? 'Submitting…' : 'Submit application'}</Button></DialogFooter></DialogContent></Dialog>
  </div></main>;
}

function Summary({ icon: Icon, value, label }: { icon: typeof UserGroupIcon; value: number; label: string }) { return <div className="flex items-center gap-4 bg-background px-5 py-5"><Icon className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
