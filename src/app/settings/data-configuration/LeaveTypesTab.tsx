"use client";

import * as React from 'react';
import { CloudDownload, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { readJsonObject } from '@/lib/response-json';
import { SortableNativeHeader, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from '@/components/ui/sortable-table';

type LeaveTypeRecord = {
  id: string;
  name?: unknown;
  leaveType?: unknown;
  annualAllowance?: unknown;
  requiresApproval?: unknown;
  isActive?: unknown;
};

const emptyForm = { name: '', leaveType: 'annual', annualAllowance: '0', requiresApproval: 'true', isActive: 'true' };
const leaveTypeOptions = ['annual', 'sick', 'personal', 'maternity', 'unpaid', 'other'];

export function LeaveTypesTab({ canManage }: { canManage: boolean }) {
  const [records, setRecords] = React.useState<LeaveTypeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [appKitLoad, setAppKitLoad] = React.useState<{ environment: 'development' | 'production'; percent: number; message: string; } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = React.useState<'isActive' | 'requiresApproval'>('isActive');
  const [bulkValue, setBulkValue] = React.useState('true');
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hr/leave?view=policies', { credentials: 'include' });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(String(payload.message || 'Unable to load leave policies.'));
      const resource = payload.resource && typeof payload.resource === 'object' ? payload.resource as Record<string, unknown> : {};
      setRecords(Array.isArray(resource.records) ? resource.records as LeaveTypeRecord[] : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load leave policies.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const reset = () => { setEditingId(null); setForm(emptyForm); setError(null); };
  const openCreateDialog = () => {
    reset();
    setDialogOpen(true);
  };
  const edit = (record: LeaveTypeRecord) => {
    setEditingId(record.id);
    setError(null);
    setForm({
      name: String(record.name || ''),
      leaveType: String(record.leaveType || 'annual'),
      annualAllowance: String(record.annualAllowance ?? 0),
      requiresApproval: String(record.requiresApproval ?? true),
      isActive: String(record.isActive ?? true),
    });
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && saving) return;
    setDialogOpen(open);
    if (!open) reset();
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const suffix = editingId ? `&id=${encodeURIComponent(editingId)}` : '';
      const response = await fetch(`/api/hr/leave?view=policies${suffix}`, {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, annualAllowance: Number(form.annualAllowance) }),
      });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(String(payload.message || 'Unable to save leave policy.'));
      setDialogOpen(false);
      reset();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save leave policy.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (record: LeaveTypeRecord) => {
    if (!window.confirm(`Archive ${String(record.name || 'this leave policy')}?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/hr/leave?view=policies&id=${encodeURIComponent(record.id)}`, { method: 'DELETE', credentials: 'include' });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(String(payload.message || 'Unable to archive leave policy.'));
      if (editingId === record.id) reset();
      await load();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive leave policy.');
    } finally {
      setSaving(false);
    }
  };

  const loadFromAppKit = async (environment: 'development' | 'production') => {
    setAppKitLoad({ environment, percent: 10, message: 'Preparing request' });
    setError(null);
    try {
      setAppKitLoad((current) => current ? { ...current, percent: 45, message: 'Downloading leave policies' } : null);
      const response = await fetch('/api/hr/leave/import-appkit-policies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(String(payload.message || 'Unable to load leave policies from AppKit.'));
      setAppKitLoad((current) => current ? { ...current, percent: 85, message: 'Applying leave policy updates' } : null);
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to load leave policies from AppKit.');
    } finally {
      setAppKitLoad(null);
    }
  };

  const bulkUpdate = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || saving) return;
    setSaving(true); setError(null);
    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`/api/hr/leave?view=policies&id=${encodeURIComponent(id)}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [bulkField]: bulkValue }) });
      if (!response.ok) throw new Error('Update failed');
    }));
    const failed = ids.filter((_, index) => results[index].status === 'rejected');
    setSelectedIds(new Set(failed));
    if (failed.length) setError(`${ids.length - failed.length} updated; ${failed.length} failed.`);
    await load(); setSaving(false);
  };

  const sortValueResolvers: SortValueResolverMap<LeaveTypeRecord> = {
    leaveType: record => String(record.leaveType || ''),
    name: record => String(record.name || ''),
    annualAllowance: record => Number(record.annualAllowance || 0),
    requiresApproval: record => String(record.requiresApproval || 'true'),
    status: record => String(record.isActive || 'true'),
  };
  const sortedRecords = sortRowsByColumn(records, sortColumn, sortDirection, sortValueResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-semibold tracking-tight">Leave Policies</h2><p className="mt-1 text-sm text-muted-foreground">Configure leave allowances and approval rules used for employee requests and allocations.</p></div>
        {canManage && <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!!appKitLoad || saving} onClick={() => void loadFromAppKit('development')}>
            {appKitLoad && appKitLoad.environment === 'development'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CloudDownload className="mr-2 h-4 w-4" />}
            {appKitLoad && appKitLoad.environment === 'development'
              ? `${appKitLoad.percent}% · ${appKitLoad.message}`
              : 'Load development'}
          </Button>
          <Button size="sm" variant="outline" disabled={!!appKitLoad || saving} onClick={() => void loadFromAppKit('production')}>
            {appKitLoad && appKitLoad.environment === 'production'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CloudDownload className="mr-2 h-4 w-4" />}
            {appKitLoad && appKitLoad.environment === 'production'
              ? `${appKitLoad.percent}% · ${appKitLoad.message}`
              : 'Load production'}
          </Button>
          <Button size="sm" onClick={openCreateDialog}><Plus className="mr-2 h-4 w-4" />Add leave policy</Button>
        </div>}
      </div>

      {canManage && (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-xl" dialogId="leave-policy-dialog">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit leave policy' : 'Add leave policy'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the allowance and approval rules for this policy.' : 'Create a leave policy for employee requests and allocations.'}
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-5 pt-2" onSubmit={event => { event.preventDefault(); void save(); }}>
              <Field label="Display name" htmlFor="leave-policy-name">
                <Input id="leave-policy-name" autoFocus value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Annual leave" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Type" htmlFor="leave-policy-type">
                  <select id="leave-policy-type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.leaveType} onChange={event => setForm(current => ({ ...current, leaveType: event.target.value }))}>{leaveTypeOptions.map(option => <option key={option} value={option} className="capitalize">{option.replace(/_/g, ' ')}</option>)}</select>
                </Field>
                <Field label="Annual allowance" htmlFor="leave-policy-allowance">
                  <Input id="leave-policy-allowance" type="number" min="0" step="0.5" value={form.annualAllowance} onChange={event => setForm(current => ({ ...current, annualAllowance: event.target.value }))} />
                </Field>
              </div>
              <Field label="Approval" htmlFor="leave-policy-approval">
                <select id="leave-policy-approval" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.requiresApproval} onChange={event => setForm(current => ({ ...current, requiresApproval: event.target.value }))}><option value="true">Required</option><option value="false">Not required</option></select>
              </Field>

              {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" disabled={saving} onClick={() => handleDialogOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.name.trim()}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingId ? 'Save changes' : 'Add leave policy'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {error && !dialogOpen && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {loading ? <div className="grid min-h-44 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : sortedRecords.length ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          {canManage && selectedIds.size > 0 && <div className="flex flex-wrap items-center gap-2 border-b bg-indigo-50 px-4 py-2"><span className="text-sm font-semibold">{selectedIds.size} selected</span><select value={bulkField} onChange={event => setBulkField(event.target.value as 'isActive' | 'requiresApproval')} className="h-8 rounded border bg-white px-2 text-sm"><option value="isActive">Status</option><option value="requiresApproval">Approval</option></select><select value={bulkValue} onChange={event => setBulkValue(event.target.value)} className="h-8 rounded border bg-white px-2 text-sm"><option value="true">{bulkField === 'isActive' ? 'Active' : 'Required'}</option><option value="false">{bulkField === 'isActive' ? 'Inactive' : 'Not required'}</option></select><Button size="sm" disabled={saving} onClick={() => void bulkUpdate()}>Apply</Button><Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button></div>}
          <table className="min-w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr>{canManage && <th className="w-12 px-4 py-3"><Checkbox aria-label="Select all leave policies" checked={records.every(record => selectedIds.has(record.id)) ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => setSelectedIds(checked === true ? new Set(records.map(record => record.id)) : new Set())} /></th>}<th className="px-4 py-3">Leave type</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Allowance</th><th className="px-4 py-3">Approval</th><th className="px-4 py-3">Status</th>{canManage && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead><tbody className="divide-y divide-border">{records.map(record => <tr key={record.id}>{canManage && <td className="px-4 py-3"><Checkbox aria-label={`Select ${String(record.name || 'leave policy')}`} checked={selectedIds.has(record.id)} onCheckedChange={checked => setSelectedIds(current => { const next = new Set(current); checked === true ? next.add(record.id) : next.delete(record.id); return next; })} /></td>}<td className="px-4 py-3 font-semibold">{String(record.name || 'Unnamed')}</td><td className="px-4 py-3 capitalize text-muted-foreground">{String(record.leaveType || 'other').replace(/_/g, ' ')}</td><td className="px-4 py-3 tabular-nums">{String(record.annualAllowance ?? 0)} days</td><td className="px-4 py-3">{String(record.requiresApproval) === 'false' ? 'Not required' : 'Required'}</td><td className="px-4 py-3"><Badge variant={String(record.isActive) === 'false' ? 'secondary' : 'success'}>{String(record.isActive) === 'false' ? 'Inactive' : 'Active'}</Badge></td>{canManage && <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => edit(record)} aria-label={`Edit ${String(record.name)}`}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void archive(record)} aria-label={`Archive ${String(record.name)}`}><Trash2 className="h-4 w-4" /></Button></div></td>}</tr>)}</tbody></table>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {canManage && (
                  <th className="w-12 px-4 py-3">
                    <Checkbox aria-label="Select all leave policies" checked={sortedRecords.every(record => selectedIds.has(record.id)) ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => setSelectedIds(checked === true ? new Set(sortedRecords.map(record => record.id)) : new Set())} />
                  </th>
                )}
                <SortableNativeHeader column="leaveType" label="Leave type" className="px-4 py-3" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableNativeHeader column="name" label="Code" className="px-4 py-3" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableNativeHeader column="annualAllowance" label="Allowance" className="px-4 py-3" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableNativeHeader column="requiresApproval" label="Approval" className="px-4 py-3" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                <SortableNativeHeader column="status" label="Status" className="px-4 py-3" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedRecords.map((record) => (
                <tr key={record.id}>
                  {canManage && (
                    <td className="px-4 py-3">
                      <Checkbox
                        aria-label={`Select ${String(record.name || 'leave policy')}`}
                        checked={selectedIds.has(record.id)}
                        onCheckedChange={checked => setSelectedIds(current => {
                          const next = new Set(current);
                          checked === true ? next.add(record.id) : next.delete(record.id);
                          return next;
                        })}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-semibold">{String(record.name || 'Unnamed')}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{String(record.leaveType || 'other').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 tabular-nums">{String(record.annualAllowance ?? 0)} days</td>
                  <td className="px-4 py-3">{String(record.requiresApproval) === 'false' ? 'Not required' : 'Required'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={String(record.isActive) === 'false' ? 'secondary' : 'success'}>
                      {String(record.isActive) === 'false' ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => edit(record)} aria-label={`Edit ${String(record.name)}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => void archive(record)} aria-label={`Archive ${String(record.name)}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center"><p className="font-medium">No leave policies configured</p><p className="mt-1 text-sm text-muted-foreground">Add the first leave policy to make it available for employee requests and allocations.</p></div>}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
