"use client";

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HrisEmptyState, HrisMetric, HrisSurface } from '@/components/hris/HrisWorkspacePrimitives';
import { hasPermission } from '@/lib/permissions';
import { HrEmployeeSearchSelect } from './HrEmployeeSearchSelect';

type Row = Record<string, unknown> & { id: string; version?: number };

type AssetInventoryWorkspaceProps = {
  employeeId?: string;
  employeeName?: string;
};

const emptyAsset = { assetTag: '', assetType: 'Laptop', name: '', serialNumber: '', purchaseDate: '', value: '', currency: 'THB' };

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function date(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsed);
}

function employeeLabel(employee: Row | undefined) {
  if (!employee) return 'Unknown employee';
  return `${text(employee.firstName, '')} ${text(employee.lastName, '')}`.trim() || text(employee.email, 'Unknown employee');
}

function tone(status: unknown) {
  if (status === 'available') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';
  if (status === 'assigned') return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300';
  if (status === 'maintenance') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
  return 'border-border bg-muted/50 text-muted-foreground';
}

export function AssetInventoryWorkspace({ employeeId, employeeName }: AssetInventoryWorkspaceProps) {
  const { data: session } = useSession();
  const canManage = hasPermission(session?.user, 'HR_PEOPLE_MANAGE');
  const embedded = Boolean(employeeId);
  const [assets, setAssets] = React.useState<Row[]>([]);
  const [assignments, setAssignments] = React.useState<Row[]>([]);
  const [employees, setEmployees] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [assetDialog, setAssetDialog] = React.useState(false);
  const [assignDialog, setAssignDialog] = React.useState(false);
  const [assetForm, setAssetForm] = React.useState(emptyAsset);
  const [assignmentForm, setAssignmentForm] = React.useState({ assetId: '', employeeId: employeeId || '', expectedReturnAt: '', notes: '' });
  const [saving, setSaving] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const assignmentQuery = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}&pageSize=100` : '?pageSize=100';
      const [assetResponse, assignmentResponse, employeeResponse] = await Promise.all([
        fetch('/api/hr/v1/assets?pageSize=100', { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/hr/v1/asset-assignments${assignmentQuery}`, { credentials: 'include', cache: 'no-store' }),
        embedded ? Promise.resolve(null) : fetch('/api/hr/employees', { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!assetResponse.ok || !assignmentResponse.ok) throw new Error('Unable to load asset inventory.');
      const [assetPayload, assignmentPayload, employeePayload] = await Promise.all([
        assetResponse.json(), assignmentResponse.json(), employeeResponse?.json(),
      ]);
      setAssets(assetPayload.data || []);
      setAssignments(assignmentPayload.data || []);
      setEmployees(employeePayload?.resource?.records || []);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load asset inventory.');
    } finally {
      setLoading(false);
    }
  }, [embedded, employeeId]);

  React.useEffect(() => { void load(); }, [load]);

  const currentAssignments = assignments.filter(item => item.status === 'assigned');
  const assignedAssetIds = new Set(currentAssignments.map(item => String(item.assetId)));
  const visibleAssets = assets.filter(asset => {
    if (embedded && !assignments.some(item => item.assetId === asset.id)) return false;
    const searchable = `${asset.assetTag} ${asset.name} ${asset.assetType} ${asset.serialNumber}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (status === 'all' || String(asset.status) === status);
  });

  const selectedAsset = React.useMemo(() => assets.find(asset => asset.id === selectedAssetId) || null, [assets, selectedAssetId]);
  const selectedAssetAssignment = React.useMemo(() => {
    if (!selectedAsset) return undefined;
    return assignments.find(item => item.assetId === selectedAsset.id && item.status === 'assigned') || assignments.find(item => item.assetId === selectedAsset.id);
  }, [assignments, selectedAsset]);
  const selectedAssetCustodian = React.useMemo(() => {
    if (!selectedAssetAssignment) return undefined;
    return employees.find(employee => employee.id === selectedAssetAssignment.employeeId);
  }, [employees, selectedAssetAssignment]);

  async function createAsset() {
    setSaving(true);
    try {
      const response = await fetch('/api/hr/v1/assets', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetTag: assetForm.assetTag,
          assetType: assetForm.assetType,
          name: assetForm.name,
          serialNumber: assetForm.serialNumber || null,
          purchaseDate: assetForm.purchaseDate || null,
          value: assetForm.value === '' ? null : Number(assetForm.value),
          currency: assetForm.currency,
          metadata: {},
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to create asset.');
      toast.success('Asset added to inventory');
      setAssetDialog(false); setAssetForm(emptyAsset); await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Unable to create asset.'); }
    finally { setSaving(false); }
  }

  async function assignAsset() {
    setSaving(true);
    try {
      const response = await fetch('/api/hr/v1/asset-assignments', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: assignmentForm.assetId,
          employeeId: assignmentForm.employeeId,
          expectedReturnAt: assignmentForm.expectedReturnAt ? new Date(`${assignmentForm.expectedReturnAt}T12:00:00`).toISOString() : null,
          notes: assignmentForm.notes || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to assign asset.');
      const asset = assets.find(item => item.id === assignmentForm.assetId);
      if (asset) await updateAssetStatus(asset, 'assigned');
      toast.success('Equipment assigned');
      setAssignDialog(false); setAssignmentForm({ assetId: '', employeeId: employeeId || '', expectedReturnAt: '', notes: '' }); await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Unable to assign equipment.'); }
    finally { setSaving(false); }
  }

  async function updateAssetStatus(asset: Row, nextStatus: string) {
    const response = await fetch(`/api/hr/v1/assets?id=${asset.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion: asset.version || 1, status: nextStatus, reason: `Asset status changed to ${nextStatus}`, changes: {} }),
    });
    if (!response.ok) throw new Error('The custody record was saved, but the inventory status could not be updated. Refresh and try again.');
  }

  async function returnAsset(assignment: Row, asset: Row) {
    setSaving(true);
    try {
      const response = await fetch(`/api/hr/v1/asset-assignments?id=${assignment.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: assignment.version || 1, status: 'returned', reason: 'Equipment returned', changes: { returnedAt: new Date().toISOString(), returnCondition: 'good' } }),
      });
      if (!response.ok) throw new Error('Unable to record the return.');
      await updateAssetStatus(asset, 'available');
      toast.success('Equipment returned to inventory'); await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Unable to return equipment.'); }
    finally { setSaving(false); }
  }

  const availableAssets = assets.filter(asset => asset.status === 'available' && !assignedAssetIds.has(asset.id));
  const clearAssetDetails = React.useCallback(() => setSelectedAssetId(''), []);

  return (
    <div className={embedded ? 'space-y-5' : 'min-h-full w-full bg-background text-foreground'}>
      <header className={embedded ? 'flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between' : 'flex flex-col gap-4 px-4 pb-1 pt-6 sm:flex-row sm:items-end sm:justify-between sm:px-6'}>
        <div>
          {!embedded && <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">People · Equipment custody</p>}
          <h1 className={embedded ? 'text-base font-semibold text-foreground' : 'mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl'}>{embedded ? 'Employee equipment' : 'Asset inventory'}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {embedded ? `Equipment currently or previously assigned to ${employeeName || 'this employee'}.` : 'Track company equipment from purchase through employee custody, return, and reuse.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size={embedded ? 'sm' : 'default'} onClick={() => void load()} disabled={loading}><ArrowPathIcon className="mr-2 h-4 w-4" />Refresh</Button>
          {canManage && <Button size={embedded ? 'sm' : 'default'} onClick={() => { setAssignmentForm(current => ({ ...current, employeeId: employeeId || current.employeeId })); setAssignDialog(true); }}><UserPlusIcon className="mr-2 h-4 w-4" />Assign equipment</Button>}
          {!embedded && canManage && <Button variant="outline" onClick={() => setAssetDialog(true)}><PlusIcon className="mr-2 h-4 w-4" />New asset</Button>}
        </div>
      </header>

      {!embedded && <div className="px-4 py-5 sm:px-6"><HrisSurface className="grid overflow-hidden sm:grid-cols-3">
        <HrisMetric label="Inventory" value={assets.length} helper="Tracked company assets" icon={ComputerDesktopIcon} />
        <HrisMetric label="Available" value={assets.filter(item => item.status === 'available').length} helper="Ready for assignment" icon={PlusIcon} />
        <HrisMetric label="In employee custody" value={currentAssignments.length} helper="Active custody records" icon={UserPlusIcon} />
      </HrisSurface></div>}

      <div className={embedded ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col gap-3 border-y border-border px-4 py-3 sm:flex-row sm:px-5'}>
        <div className="relative flex-1"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tag, equipment, type, or serial number" className="pl-9" /></div>
        {!embedded && <select value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All statuses</option><option value="available">Available</option><option value="assigned">Assigned</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option></select>}
      </div>

      <section className={embedded ? 'overflow-hidden rounded-xl border border-border bg-background' : 'overflow-hidden bg-background'}>
        {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading equipment…</div> : visibleAssets.length === 0 ? (
          <HrisEmptyState icon={ComputerDesktopIcon} title={embedded ? 'No equipment assigned' : 'No assets match this view'} description={embedded ? 'Assign an available asset to establish a clear custody record.' : 'Adjust the search or add the first company asset.'} />
        ) : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/35 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Type & serial</th>{!embedded && <th className="px-4 py-3">Custodian</th>}<th className="px-4 py-3">Status</th><th className="px-4 py-3">Return</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-border">{visibleAssets.map(asset => {
            const assignment = assignments.find(item => item.assetId === asset.id && item.status === 'assigned') || assignments.find(item => item.assetId === asset.id);
            const custodian = employees.find(item => item.id === assignment?.employeeId);
            return <tr
              key={asset.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:bg-muted/20 focus-visible:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => setSelectedAssetId(asset.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedAssetId(asset.id);
                }
              }}
            >
              <td className="px-4 py-3"><p className="font-semibold text-foreground">{text(asset.name)}</p><p className="text-xs text-muted-foreground">{text(asset.assetTag)}</p></td>
              <td className="px-4 py-3"><p>{text(asset.assetType)}</p><p className="text-xs text-muted-foreground">{text(asset.serialNumber, 'No serial number')}</p></td>
              {!embedded && <td className="px-4 py-3">{assignment?.status === 'assigned' ? <Link href={`/people/${assignment.employeeId}?tab=Assets`} className="font-medium text-primary hover:underline" onClick={event => event.stopPropagation()}>{employeeLabel(custodian)}</Link> : <span className="text-muted-foreground">Unassigned</span>}</td>}
              <td className="px-4 py-3"><Badge variant="outline" className={tone(asset.status)}>{text(asset.status)}</Badge></td>
              <td className="px-4 py-3"><p>{date(assignment?.expectedReturnAt)}</p>{Boolean(assignment?.returnedAt) && <p className="text-xs text-muted-foreground">Returned {date(assignment?.returnedAt)}</p>}</td>
              <td className="px-4 py-3 text-right">{canManage && assignment?.status === 'assigned' ? <Button variant="ghost" size="sm" disabled={saving} onClick={event => { event.stopPropagation(); void returnAsset(assignment, asset); }}><ArrowUturnLeftIcon className="mr-2 h-4 w-4" />Return</Button> : null}</td>
            </tr>;
          })}</tbody>
        </table></div>}
      </section>

      <Dialog open={Boolean(selectedAsset)} onOpenChange={open => { if (!open) clearAssetDetails(); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Asset details</DialogTitle><DialogDescription>Review this asset's current record and custody status.</DialogDescription></DialogHeader><div className="grid gap-4 pt-2 sm:grid-cols-2">
        <div><p className="text-xs font-semibold text-muted-foreground">Asset</p><p className="font-medium">{text(selectedAsset?.name, '—')}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Asset tag</p><p className="font-medium">{text(selectedAsset?.assetTag)}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Type</p><p className="font-medium">{text(selectedAsset?.assetType)}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Status</p><Badge variant="outline" className={tone(selectedAsset?.status)}>{text(selectedAsset?.status)}</Badge></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Serial number</p><p className="font-medium">{text(selectedAsset?.serialNumber, 'No serial number')}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Purchase date</p><p className="font-medium">{date(selectedAsset?.purchaseDate)}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Value</p><p className="font-medium">{selectedAsset?.value ? `${selectedAsset.currency || ''} ${text(selectedAsset.value)}` : '—'}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Custodian</p><p className="font-medium">{selectedAssetAssignment ? employeeLabel(selectedAssetCustodian) : 'Unassigned'}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Expected return</p><p className="font-medium">{date(selectedAssetAssignment?.expectedReturnAt)}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Last updated</p><p className="font-medium">{date(selectedAsset?.updatedAt)}</p></div>
        <div className="sm:col-span-2"><p className="text-xs font-semibold text-muted-foreground">Notes</p><p className="break-words text-sm text-foreground/90">{text(selectedAssetAssignment?.notes, 'No custody notes')}</p></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setSelectedAssetId('')}>Close</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={assetDialog} onOpenChange={setAssetDialog}><DialogContent><DialogHeader><DialogTitle>Add asset</DialogTitle><DialogDescription>Create an inventory record before assigning equipment to an employee.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2">
        <Field label="Asset tag"><Input value={assetForm.assetTag} onChange={event => setAssetForm(current => ({ ...current, assetTag: event.target.value }))} placeholder="IT-00042" /></Field>
        <Field label="Type"><Input value={assetForm.assetType} onChange={event => setAssetForm(current => ({ ...current, assetType: event.target.value }))} /></Field>
        <div className="sm:col-span-2"><Field label="Equipment name"><Input value={assetForm.name} onChange={event => setAssetForm(current => ({ ...current, name: event.target.value }))} placeholder="MacBook Pro 14-inch" /></Field></div>
        <Field label="Serial number"><Input value={assetForm.serialNumber} onChange={event => setAssetForm(current => ({ ...current, serialNumber: event.target.value }))} /></Field>
        <Field label="Purchase date"><Input type="date" value={assetForm.purchaseDate} onChange={event => setAssetForm(current => ({ ...current, purchaseDate: event.target.value }))} /></Field>
        <Field label="Value"><Input type="number" min="0" value={assetForm.value} onChange={event => setAssetForm(current => ({ ...current, value: event.target.value }))} /></Field>
        <Field label="Currency"><Input maxLength={3} value={assetForm.currency} onChange={event => setAssetForm(current => ({ ...current, currency: event.target.value.toUpperCase() }))} /></Field>
      </div><DialogFooter><Button variant="outline" onClick={() => setAssetDialog(false)}>Cancel</Button><Button disabled={saving || !assetForm.assetTag || !assetForm.name || !assetForm.assetType} onClick={() => void createAsset()}>{saving ? 'Adding…' : 'Add asset'}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}><DialogContent><DialogHeader><DialogTitle>Assign equipment</DialogTitle><DialogDescription>Create a custody record with an optional expected return date.</DialogDescription></DialogHeader><div className="space-y-4 py-2">
        <Field label="Available asset"><select value={assignmentForm.assetId} onChange={event => setAssignmentForm(current => ({ ...current, assetId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select equipment</option>{availableAssets.map(asset => <option key={asset.id} value={asset.id}>{text(asset.assetTag)} · {text(asset.name)}</option>)}</select></Field>
        {!embedded && <Field label="Employee"><HrEmployeeSearchSelect value={assignmentForm.employeeId} onValueChange={employeeId => setAssignmentForm(current => ({ ...current, employeeId }))} /></Field>}
        <Field label="Expected return date"><Input type="date" value={assignmentForm.expectedReturnAt} onChange={event => setAssignmentForm(current => ({ ...current, expectedReturnAt: event.target.value }))} /></Field>
        <Field label="Custody notes"><Input value={assignmentForm.notes} onChange={event => setAssignmentForm(current => ({ ...current, notes: event.target.value }))} placeholder="Accessories, condition, or handover notes" /></Field>
      </div><DialogFooter><Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button><Button disabled={saving || !assignmentForm.assetId || !assignmentForm.employeeId} onClick={() => void assignAsset()}>{saving ? 'Assigning…' : 'Assign equipment'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
