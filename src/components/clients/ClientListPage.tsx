"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HrisEmptyState, HrisMetric, HrisSurface, HrisWorkspaceHeader } from "@/components/hris/HrisWorkspacePrimitives";
import { hasPermission } from "@/lib/permissions";

interface ClientRecord {
  id: string;
  clientCode?: string | null;
  name?: string | null;
  industry?: string | null;
  primaryContactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  address?: string | null;
  status?: string | null;
  notes?: string | null;
  employeeCount?: number | null;
}

interface ClientForm {
  clientCode: string;
  name: string;
  industry: string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  status: string;
  notes: string;
}

const emptyForm: ClientForm = {
  clientCode: "",
  name: "",
  industry: "",
  primaryContactName: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  address: "",
  status: "active",
  notes: "",
};

function toForm(client?: ClientRecord | null): ClientForm {
  if (!client) return { ...emptyForm };
  return {
    clientCode: client.clientCode || "",
    name: client.name || "",
    industry: client.industry || "",
    primaryContactName: client.primaryContactName || "",
    contactEmail: client.contactEmail || "",
    contactPhone: client.contactPhone || "",
    website: client.website || "",
    address: client.address || "",
    status: client.status || "active",
    notes: client.notes || "",
  };
}

function optional(value: string) {
  return value.trim() || null;
}

export function ClientListPage() {
  const { data: session } = useSession();
  const canManage = hasPermission(session?.user, "HR_PEOPLE_MANAGE");
  const [clients, setClients] = React.useState<ClientRecord[]>([]);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingClient, setEditingClient] = React.useState<ClientRecord | null>(null);
  const [form, setForm] = React.useState<ClientForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = React.useState(false);

  const loadClients = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hr/clients", { credentials: "include" });
      const payload = await response.json().catch(() => null) as {
        resource?: { records?: ClientRecord[] };
        message?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to load clients.");
      setClients(payload?.resource?.records || []);
    } catch (loadError) {
      setClients([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load clients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clients.filter(client => {
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesQuery = !normalizedQuery || [
        client.clientCode,
        client.name,
        client.industry,
        client.primaryContactName,
        client.contactEmail,
        client.contactPhone,
      ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [clients, query, statusFilter]);

  const activeCount = clients.filter(client => client.status === "active").length;
  const assignedCount = clients.reduce((total, client) => total + Number(client.employeeCount || 0), 0);

  const openCreate = () => {
    setEditingClient(null);
    setForm(toForm());
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (client: ClientRecord) => {
    setEditingClient(client);
    setForm(toForm(client));
    setError(null);
    setDialogOpen(true);
  };

  const saveClient = async () => {
    if (!form.clientCode.trim() || !form.name.trim()) {
      setError("Client code and client name are required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const suffix = editingClient ? `?id=${encodeURIComponent(editingClient.id)}` : "";
      const response = await fetch(`/api/hr/clients${suffix}`, {
        method: editingClient ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientCode: form.clientCode.trim(),
          name: form.name.trim(),
          industry: optional(form.industry),
          primaryContactName: optional(form.primaryContactName),
          contactEmail: optional(form.contactEmail),
          contactPhone: optional(form.contactPhone),
          website: optional(form.website),
          address: optional(form.address),
          status: form.status,
          notes: optional(form.notes),
        }),
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to save client.");
      setDialogOpen(false);
      await loadClients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveClient = async (client: ClientRecord) => {
    if (Number(client.employeeCount || 0) > 0) {
      setError("Reassign this client's employees before archiving the client.");
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/hr/clients?id=${encodeURIComponent(client.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || "Unable to archive client.");
      await loadClients();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Unable to archive client.");
    }
  };

  const updateSelectedStatus = async (status: 'active' | 'inactive') => {
    const ids = Array.from(selectedIds);
    if (!ids.length || bulkUpdating) return;
    setBulkUpdating(true); setError(null);
    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`/api/hr/clients?id=${encodeURIComponent(id)}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('Update failed');
    }));
    const failed = ids.filter((_, index) => results[index].status === 'rejected');
    setSelectedIds(new Set(failed));
    if (failed.length) setError(`${ids.length - failed.length} updated; ${failed.length} failed.`);
    await loadClients(); setBulkUpdating(false);
  };

  const allFilteredSelected = filteredClients.length > 0 && filteredClients.every(client => selectedIds.has(client.id));

  return (
    <main className="min-h-full w-full bg-background text-foreground">
      <div className="space-y-5 px-4 py-5 sm:px-6">
        <HrisWorkspaceHeader
          eyebrow="People · Client assignments"
          title="Client list"
          description="Maintain customer details and the organizations where subcontract employees work."
          action={canManage ? (
            <Button type="button" className="h-10 gap-2 self-start lg:self-auto" onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              New client
            </Button>
          ) : undefined}
        />

        <HrisSurface className="grid overflow-hidden sm:grid-cols-3">
          <HrisMetric label="All clients" value={clients.length} helper="Organizations in the directory" icon={BuildingOffice2Icon} />
          <HrisMetric label="Active clients" value={activeCount} helper="Available for employee assignment" icon={GlobeAltIcon} />
          <HrisMetric label="Assigned employees" value={assignedCount} helper="People working across clients" icon={UsersIcon} />
        </HrisSurface>
      </div>

      <section className="w-full border-t border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <label className="relative block w-full sm:max-w-md">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-muted/35 pl-9 pr-3 text-sm outline-none transition-colors focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Search client, contact, or industry"
              />
            </label>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter clients by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
        </div>

          {error && <p role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{error}</p>}
          {canManage && selectedIds.size > 0 && <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-5 py-2"><span className="text-sm font-semibold">{selectedIds.size} selected</span><Button size="sm" disabled={bulkUpdating} onClick={() => void updateSelectedStatus('active')}>Activate</Button><Button size="sm" variant="outline" disabled={bulkUpdating} onClick={() => void updateSelectedStatus('inactive')}>Deactivate</Button><Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button></div>}

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/35 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  {canManage && <th className="w-12 px-4 py-3"><Checkbox aria-label="Select all clients" checked={allFilteredSelected ? true : selectedIds.size ? 'indeterminate' : false} onCheckedChange={checked => setSelectedIds(checked === true ? new Set(filteredClients.map(client => client.id)) : new Set())} /></th>}
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Primary contact</th>
                  <th className="px-4 py-3">Contact details</th>
                  <th className="px-4 py-3">Employees</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: canManage ? 8 : 6 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredClients.length ? filteredClients.map(client => (
                  <tr key={client.id} className="align-top transition-colors hover:bg-muted/20">
                    {canManage && <td className="px-4 py-4"><Checkbox aria-label={`Select ${client.name || 'client'}`} checked={selectedIds.has(client.id)} onCheckedChange={checked => setSelectedIds(current => { const next = new Set(current); checked === true ? next.add(client.id) : next.delete(client.id); return next; })} /></td>}
                    <td className="px-4 py-4 font-semibold text-primary">{client.clientCode || "—"}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{client.name || "Unnamed client"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{client.industry || "Industry not set"}</p>
                    </td>
                    <td className="px-4 py-4 text-foreground/80">{client.primaryContactName || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {client.contactEmail && <p className="flex items-center gap-1.5"><EnvelopeIcon className="h-3.5 w-3.5" />{client.contactEmail}</p>}
                        {client.contactPhone && <p className="flex items-center gap-1.5"><PhoneIcon className="h-3.5 w-3.5" />{client.contactPhone}</p>}
                        {!client.contactEmail && !client.contactPhone && "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium tabular-nums text-foreground">{Number(client.employeeCount || 0)}</td>
                    <td className="px-4 py-4">
                      <Badge variant={client.status === "active" ? "success" : "outline"} className="rounded-full capitalize">
                        {client.status || "inactive"}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(client)} aria-label={`Edit ${client.name}`}>
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => void archiveClient(client)} aria-label={`Archive ${client.name}`}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={canManage ? 8 : 6} className="px-4 py-12 text-center">
                      <HrisEmptyState
                        icon={BuildingOffice2Icon}
                        title="No clients found"
                        description="Add a client or adjust the current search filters."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>Store the common details used for subcontract employee assignments.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <ClientField label="Client code" required>
              <Input value={form.clientCode} onChange={event => setForm(current => ({ ...current, clientCode: event.target.value }))} />
            </ClientField>
            <ClientField label="Client name" required>
              <Input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
            </ClientField>
            <ClientField label="Industry">
              <Input value={form.industry} onChange={event => setForm(current => ({ ...current, industry: event.target.value }))} />
            </ClientField>
            <ClientField label="Primary contact">
              <Input value={form.primaryContactName} onChange={event => setForm(current => ({ ...current, primaryContactName: event.target.value }))} />
            </ClientField>
            <ClientField label="Contact email">
              <Input type="email" value={form.contactEmail} onChange={event => setForm(current => ({ ...current, contactEmail: event.target.value }))} />
            </ClientField>
            <ClientField label="Contact phone">
              <Input value={form.contactPhone} onChange={event => setForm(current => ({ ...current, contactPhone: event.target.value }))} />
            </ClientField>
            <ClientField label="Website">
              <Input value={form.website} onChange={event => setForm(current => ({ ...current, website: event.target.value }))} placeholder="https://" />
            </ClientField>
            <ClientField label="Status">
              <select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </ClientField>
            <ClientField label="Address" wide>
              <Textarea value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} />
            </ClientField>
            <ClientField label="Notes" wide>
              <Textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} />
            </ClientField>
          </div>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isSaving || !form.clientCode.trim() || !form.name.trim()} onClick={() => void saveClient()}>
              {isSaving ? "Saving…" : "Save client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ClientField({
  label,
  required,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}{required && <span className="text-red-600"> *</span>}</Label>
      {children}
    </div>
  );
}
