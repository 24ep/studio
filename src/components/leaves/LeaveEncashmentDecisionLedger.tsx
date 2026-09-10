"use client";

import * as React from 'react';
import { AlertTriangle, CalendarDays, Check, CheckCircle2, ChevronRight, Eye, Filter, MoreVertical, Plus, Search, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type SourceRow = Record<string, unknown>;
type LedgerStatus = 'needs_review' | 'ready_for_payroll' | 'paid' | 'returned';

interface LedgerRow {
  id: string; source?: SourceRow; employee: string; employeeNumber: string; department: string;
  policy: string; requested: number; eligible: number; estimatedValue: number; payrollPeriod: string;
  payDate: string; submitted: string; status: LedgerStatus; warning?: string;
}

interface Props {
  rows: SourceRow[]; canManage: boolean; submitting: boolean; onNewRequest: () => void;
  act: (body: SourceRow, successMessage: string) => Promise<unknown>;
}

const tabs: Array<{ status: LedgerStatus; label: string }> = [
  { status: 'needs_review', label: 'Needs review' }, { status: 'ready_for_payroll', label: 'Ready for payroll' },
  { status: 'paid', label: 'Paid' }, { status: 'returned', label: 'Returned' },
];

const val = (input: unknown, fallback = '—') => input === null || input === undefined || input === '' ? fallback : String(input);
const num = (input: unknown) => Number.isFinite(Number(input)) ? Number(input) : 0;
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

function mapStatus(input: unknown): LedgerStatus {
  const status = val(input, '').toLowerCase();
  if (status === 'paid') return 'paid';
  if (['approved', 'reserved', 'processing', 'sent_to_payroll'].includes(status)) return 'ready_for_payroll';
  if (['rejected', 'returned', 'returned_for_revision'].includes(status)) return 'returned';
  return 'needs_review';
}

function mapRow(row: SourceRow, index: number): LedgerRow {
  const requested = num(row.requested_units);
  const created = row.created_at ? new Date(String(row.created_at)) : null;
  return { id: val(row.id, `request-${index}`), source: row, employee: `${val(row.first_name, 'Employee')} ${val(row.last_name, '')}`.trim(), employeeNumber: val(row.employee_number, 'Not assigned'), department: val(row.department_name, 'Unassigned'), policy: val(row.policy_name, 'Leave encashment'), requested, eligible: row.approved_units == null ? requested : num(row.approved_units), estimatedValue: num(row.estimated_value ?? row.payout_amount), payrollPeriod: val(row.payroll_period, 'Not assigned'), payDate: val(row.payment_date, 'Not scheduled'), submitted: created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown', status: mapStatus(row.status) };
}

export function LeaveEncashmentDecisionLedger({ rows, canManage, submitting, onNewRequest, act }: Props) {
  const baseRows = React.useMemo(() => rows.map(mapRow), [rows]);
  const [items, setItems] = React.useState(baseRows);
  const [activeStatus, setActiveStatus] = React.useState<LedgerStatus>('needs_review');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = React.useState<LedgerRow | null>(null);
  const [query, setQuery] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  React.useEffect(() => setItems(baseRows), [baseRows]);

  const visible = items.filter(row => row.status === activeStatus && `${row.employee} ${row.employeeNumber} ${row.policy}`.toLowerCase().includes(query.toLowerCase()));
  const allSelected = visible.length > 0 && visible.every(row => selectedIds.has(row.id));

  const updateLocalStatus = (row: LedgerRow, status: LedgerStatus, message: string) => {
    setItems(current => current.map(item => item.id === row.id ? { ...item, status } : item));
    setSelectedIds(current => { const next = new Set(current); next.delete(row.id); return next; });
    setSelectedRow(current => current?.id === row.id ? { ...current, status } : current);
    toast.success(message);
  };
  const decide = async (row: LedgerRow, decision: 'approved' | 'sent_to_payroll' | 'paid' | 'rejected') => {
    const next: LedgerStatus = decision === 'paid' ? 'paid' : decision === 'rejected' ? 'returned' : 'ready_for_payroll';
    const message = decision === 'approved' ? 'Encashment approved for payroll.' : decision === 'sent_to_payroll' ? 'Encashment sent to Payroll.' : decision === 'paid' ? 'Encashment marked paid.' : 'Encashment returned.';
    if (!row.source) return;
    const result = await act({ action: 'encashment_decision', id: row.source.id, decision, expectedVersion: row.source.version, comment: decision === 'rejected' ? 'Returned from the encashment review queue.' : null }, message);
    if (result) updateLocalStatus(row, next, message);
  };
  const bulkApprove = async (send = false) => { for (const row of items.filter(item => selectedIds.has(item.id))) await decide(row, send ? 'sent_to_payroll' : 'approved'); setSelectedIds(new Set()); };

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">{tabs.map(tab => <button key={tab.status} type="button" onClick={() => { setActiveStatus(tab.status); setSelectedIds(new Set()); }} className={cn('flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors', activeStatus === tab.status ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{tab.label}<span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', activeStatus === tab.status ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{items.filter(row => row.status === tab.status).length}</span></button>)}</div>
      <div className="flex shrink-0 items-center gap-2"><span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><CalendarDays className="h-4 w-4" />As of Aug 13, 2026</span><Button variant="outline" size="sm" onClick={() => setFiltersOpen(current => !current)}><Filter className="mr-2 h-4 w-4" />Filters</Button><Button size="sm" onClick={onNewRequest}><Plus className="mr-2 h-4 w-4" />New encashment request</Button></div>
    </div>
    {filtersOpen && <div className="flex items-center gap-3 border-b border-border/70 pb-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search employee, ID, or policy" /></div><Button variant="ghost" size="sm" onClick={() => setQuery('')}>Clear</Button></div>}
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className={cn('flex min-h-12 items-center gap-2 border-b border-border/70 px-4', selectedIds.size ? 'bg-primary/[0.035]' : 'bg-muted/20')}>{selectedIds.size ? <><span className="mr-2 text-sm font-semibold">{selectedIds.size} selected</span><Button size="sm" variant="ghost" onClick={() => void bulkApprove()}><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />Approve</Button><Button size="sm" variant="ghost" onClick={() => void bulkApprove(true)}><Send className="mr-2 h-4 w-4 text-primary" />Approve &amp; send to payroll</Button><Button size="icon" variant="ghost" className="ml-auto h-8 w-8" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button></> : <><p className="text-sm font-semibold">{tabs.find(tab => tab.status === activeStatus)?.label}</p><p className="text-xs text-muted-foreground">Review eligibility and payroll impact before taking action.</p></>}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] table-fixed text-left text-sm"><thead className="border-b border-border/70 bg-muted/20 text-xs text-muted-foreground"><tr><th className="w-12 px-4 py-3"><Checkbox aria-label="Select all" checked={allSelected ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => setSelectedIds(checked === true ? new Set(visible.map(row => row.id)) : new Set())} /></th><th className="w-[18%] py-3">Employee</th><th className="w-[18%] px-3 py-3">Policy</th><th className="w-[11%] px-3 py-3">Requested</th><th className="w-[9%] px-3 py-3">Eligible</th><th className="w-[12%] px-3 py-3">Est. value</th><th className="w-[14%] px-3 py-3">Payroll period</th><th className="w-[12%] px-3 py-3">Status</th><th className="w-28 px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-border/70">{visible.map(row => <tr key={row.id} className={cn('cursor-pointer hover:bg-muted/25', selectedIds.has(row.id) && 'bg-primary/[0.035]')} onClick={() => setSelectedRow(row)}><td className="px-4 py-3" onClick={event => event.stopPropagation()}><Checkbox aria-label={`Select ${row.employee}`} checked={selectedIds.has(row.id)} onCheckedChange={checked => setSelectedIds(current => { const next = new Set(current); checked === true ? next.add(row.id) : next.delete(row.id); return next; })} /></td><td className="py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(row.employee)}</span><div className="min-w-0"><p className="truncate font-medium">{row.employee}</p><p className="truncate text-xs text-muted-foreground">{row.employeeNumber} · {row.department}</p></div></div></td><td className="px-3 py-3"><p className="truncate">{row.policy}</p></td><td className="px-3 py-3"><p className="font-medium">{row.requested} days</p><p className="text-xs text-muted-foreground">Submitted {row.submitted.replace(', 2026', '')}</p></td><td className="px-3 py-3 font-medium">{row.eligible} days</td><td className="px-3 py-3 font-medium tabular-nums">{money(row.estimatedValue)}</td><td className="px-3 py-3"><p>{row.payrollPeriod}</p><p className="text-xs text-muted-foreground">Pay date {row.payDate}</p></td><td className="px-3 py-3"><StatusPill status={row.status} />{row.warning && <p className="mt-1.5 flex gap-1 text-xs leading-4 text-amber-700"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{row.warning}</p>}</td><td className="px-4 py-3" onClick={event => event.stopPropagation()}><div className="flex justify-end"><RowAction row={row} canManage={canManage} submitting={submitting} onDecide={decide} onView={() => setSelectedRow(row)} /><Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></div></td></tr>)}{!visible.length && <tr><td colSpan={9} className="px-6 py-16 text-center"><p className="font-medium">No requests match this view</p><p className="mt-1 text-sm text-muted-foreground">Try another status or clear the search filter.</p></td></tr>}</tbody></table></div>
      <div className="flex justify-between border-t border-border/70 px-4 py-3 text-xs text-muted-foreground"><span>Showing 1 to {visible.length} of {visible.length} requests</span><span>25 per page</span></div>
    </section>
    <Details row={selectedRow} canManage={canManage} submitting={submitting} onClose={() => setSelectedRow(null)} onDecide={decide} />
  </div>;
}

function StatusPill({ status }: { status: LedgerStatus }) { const styles = { needs_review: 'bg-amber-100 text-amber-800', ready_for_payroll: 'bg-blue-100 text-blue-700', paid: 'bg-emerald-100 text-emerald-700', returned: 'bg-rose-100 text-rose-700' }; const labels = { needs_review: 'Needs review', ready_for_payroll: 'Ready for payroll', paid: 'Paid', returned: 'Returned' }; return <span className={cn('inline-flex rounded px-2 py-1 text-xs font-medium', styles[status])}>{labels[status]}</span>; }

function RowAction({ row, canManage, submitting, onDecide, onView }: { row: LedgerRow; canManage: boolean; submitting: boolean; onDecide: (row: LedgerRow, decision: 'approved' | 'sent_to_payroll' | 'paid' | 'rejected') => Promise<void>; onView: () => void }) { if (!canManage || ['paid', 'returned'].includes(row.status)) return <Button size="sm" variant="ghost" onClick={onView}><Eye className="mr-1.5 h-4 w-4" />View</Button>; if (row.status === 'ready_for_payroll') return <Button size="sm" variant="ghost" disabled={submitting} onClick={() => void onDecide(row, 'sent_to_payroll')}><Send className="mr-1.5 h-4 w-4 text-primary" />Send</Button>; return <Button size="sm" variant="ghost" disabled={submitting || Boolean(row.warning)} onClick={() => void onDecide(row, 'approved')}><Check className="mr-1.5 h-4 w-4 text-emerald-600" />Approve</Button>; }

function Details({ row, canManage, submitting, onClose, onDecide }: { row: LedgerRow | null; canManage: boolean; submitting: boolean; onClose: () => void; onDecide: (row: LedgerRow, decision: 'approved' | 'sent_to_payroll' | 'paid' | 'rejected') => Promise<void> }) { return <Sheet open={Boolean(row)} onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="right" hideCloseButton className="flex w-[min(520px,calc(100vw-1rem))] max-w-[520px] flex-col gap-0 overflow-hidden border border-border bg-card p-0 shadow-2xl">{row && <><div className="border-b border-border/70 p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(row.employee)}</span><div className="min-w-0 flex-1"><SheetTitle>{row.employee}</SheetTitle><SheetDescription className="mt-1">{row.employeeNumber} · {row.department}</SheetDescription></div><StatusPill status={row.status} /><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button></div></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><DrawerSection title="Request summary"><dl className="grid grid-cols-2 gap-4 text-sm"><Detail label="Policy" value={row.policy} /><Detail label="Submitted" value={row.submitted} /><Detail label="Requested" value={`${row.requested} days`} /><Detail label="Eligible" value={`${row.eligible} days`} /><Detail label="Payroll period" value={row.payrollPeriod} /><Detail label="Estimated value" value={money(row.estimatedValue)} /></dl></DrawerSection><DrawerSection title="Eligibility evidence"><div className="divide-y divide-border/70 rounded-lg border border-border/70"><Evidence label="Sufficient remaining balance" detail={`${Math.max(0, 18 - row.eligible)} days remain`} passed={!row.warning?.includes('balance')} /><Evidence label="Within annual encashment cap" detail={`${row.eligible} of 8 days eligible`} passed={!row.warning?.includes('cap')} /><Evidence label="Payroll destination available" detail={`${row.payrollPeriod} · ${row.payDate}`} passed /></div>{row.warning && <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" /><div><p className="font-medium">Decision required</p><p className="mt-1 text-xs">{row.warning}. Resolve the exception before approval.</p></div></div>}</DrawerSection><DrawerSection title="Payroll handoff"><div className="rounded-lg border border-border/70 p-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Payout component</span><span className="font-medium">Leave Encashment</span></div><div className="mt-3 flex justify-between"><span className="text-muted-foreground">Estimated amount</span><span className="text-lg font-semibold">{money(row.estimatedValue)}</span></div><p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">Payroll calculates the final amount. HR approval reserves eligible leave units.</p></div></DrawerSection><DrawerSection title="Activity"><Activity title="Request submitted" detail={`${row.submitted} · ${row.employee}`} /><Activity title="Eligibility evaluated" detail={row.warning ? 'Exception found · Action needed' : 'All automatic checks passed'} /><Activity title="Payroll handoff" detail={row.status === 'paid' ? `Paid ${row.payDate}` : row.status === 'ready_for_payroll' ? 'Ready to send' : 'Pending HR review'} /></DrawerSection></div>{canManage && row.status !== 'paid' && <div className="flex justify-between border-t border-border/70 p-4"><Button variant="outline" className="text-destructive" onClick={() => void onDecide(row, 'rejected')}><X className="mr-2 h-4 w-4" />Return</Button><Button disabled={submitting || Boolean(row.warning)} onClick={() => void onDecide(row, row.status === 'ready_for_payroll' ? 'sent_to_payroll' : 'approved')}>{row.status === 'ready_for_payroll' ? <Send className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}{row.status === 'ready_for_payroll' ? 'Send to payroll' : 'Approve for payroll'}</Button></div>}</>}</SheetContent></Sheet>; }

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-6 space-y-3"><h3 className="text-sm font-semibold">{title}</h3>{children}</section>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function Evidence({ label, detail, passed }: { label: string; detail: string; passed: boolean }) { return <div className="flex gap-3 p-3"><span className={cn('mt-0.5 grid h-5 w-5 place-items-center rounded-full', passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{passed ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}</span><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div></div>; }
function Activity({ title, detail }: { title: string; detail: string }) { return <div className="mb-4 flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 rounded-full bg-primary" /><div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></div>; }
