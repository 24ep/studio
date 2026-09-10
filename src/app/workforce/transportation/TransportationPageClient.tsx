"use client";

import * as React from "react";
import { ArrowDownTrayIcon, ClockIcon, EllipsisVerticalIcon, MagnifyingGlassIcon, MapPinIcon, PencilSquareIcon, PlusIcon, TrashIcon, TruckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDropdownOptions } from "@/hooks/use-dropdown-options";
import { defaultDropdownOptions } from "@/lib/dropdown-option-catalog";

type Mode = "company_bus" | "van" | "car_allowance" | "shuttle";
type Status = "active" | "paused";
type Assignment = { id: string; employeeId: string; employee: string; employeeNumber: string; department: string | null; mode: Mode; route: string; pickupPoint: string | null; pickupTime: string | null; vehicle: string | null; status: Status };
type Form = Pick<Assignment, "employeeId" | "mode" | "route" | "pickupPoint" | "pickupTime" | "vehicle" | "status">;
type Employee = { id: string; employeeNumber: string; firstName: string; lastName: string; preferredName: string | null; departmentName: string | null };

const labels: Record<Mode, string> = { company_bus: "Company bus", van: "Van", car_allowance: "Car allowance", shuttle: "Shuttle" };
const emptyForm: Form = { employeeId: "", mode: "company_bus", route: "", pickupPoint: "", pickupTime: "07:30", vehicle: "", status: "active" };

function downloadCsv(rows: Assignment[]) {
  const columns = ["employee", "employeeNumber", "department", "mode", "route", "pickupPoint", "pickupTime", "vehicle", "status"] as const;
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.join(","), ...rows.map(row => columns.map(key => escape(key === "mode" ? labels[row.mode] : row[key])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "employee-transportation.csv"; anchor.click(); URL.revokeObjectURL(url);
}

export function TransportationPageClient() {
  const transportModes = useDropdownOptions("transportation_modes", defaultDropdownOptions("transportation_modes"));
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [query, setQuery] = React.useState("");
  const [department, setDepartment] = React.useState("All departments");
  const [status, setStatus] = React.useState("All statuses");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Form>(emptyForm);
  const [deleteTarget, setDeleteTarget] = React.useState<Assignment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [transportResponse, employeeResponse] = await Promise.all([fetch("/api/hr/transportation", { cache: "no-store" }), fetch("/api/hr/employee-options", { cache: "no-store" })]);
      const transport = await transportResponse.json(); const people = await employeeResponse.json();
      if (!transportResponse.ok) throw new Error(transport.message || "Transportation data could not be loaded.");
      setAssignments(transport.assignments || []); if (employeeResponse.ok) setEmployees(people.employees || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Transportation data could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const departments = React.useMemo(() => Array.from(new Set(assignments.map(row => row.department).filter((value): value is string => Boolean(value)))).sort(), [assignments]);
  const filtered = React.useMemo(() => assignments.filter(row => {
    const term = query.trim().toLowerCase();
    return (!term || [row.employee, row.employeeNumber, row.route, row.pickupPoint, row.vehicle].some(value => String(value || "").toLowerCase().includes(term))) && (department === "All departments" || row.department === department) && (status === "All statuses" || row.status === status);
  }), [assignments, department, query, status]);

  async function mutate(body: object) {
    setSaving(true); setError("");
    try { const response = await fetch("/api/hr/transportation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "The change could not be saved."); setAssignments(result.assignments || []); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The change could not be saved."); return false; }
    finally { setSaving(false); }
  }
  function openCreate() { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(row: Assignment) { setEditingId(row.id); setForm({ employeeId: row.employeeId, mode: row.mode, route: row.route, pickupPoint: row.pickupPoint || "", pickupTime: row.pickupTime || null, vehicle: row.vehicle || "", status: row.status }); setDialogOpen(true); }
  async function save(event: React.FormEvent) { event.preventDefault(); if (!form.employeeId || !form.route.trim()) return; if (await mutate(editingId ? { action: "update", id: editingId, data: form } : { action: "create", data: form })) setDialogOpen(false); }
  const setField = <K extends keyof Form>(key: K, value: Form[K]) => setForm(current => ({ ...current, [key]: value }));

  return <main className="min-h-full bg-muted/20 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] space-y-7">
    <header className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground"><TruckIcon className="h-4 w-4" />Workforce operations</div><h1 className="text-3xl font-semibold tracking-tight">Employee transportation</h1><p className="mt-2 text-sm text-muted-foreground">Coordinate real employee routes, pickup points, and assigned vehicles.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => downloadCsv(filtered)} disabled={!filtered.length}><ArrowDownTrayIcon className="mr-2 h-4 w-4" />Export CSV</Button><Button onClick={openCreate}><PlusIcon className="mr-2 h-4 w-4" />Add transportation</Button></div></header>
    {error && <div role="alert" className="flex items-center justify-between border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button></div>}
    <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">{[
      { label: "Active assignments", value: assignments.filter(row => row.status === "active").length, helper: "Employees with current service", Icon: UserGroupIcon },
      { label: "Routes in service", value: new Set(assignments.map(row => row.route)).size, helper: "Live routes in the register", Icon: MapPinIcon },
      { label: "Assigned fleet", value: new Set(assignments.map(row => row.vehicle).filter(Boolean)).size, helper: "Vehicles and allowance plans", Icon: TruckIcon },
    ].map(({ label, value, helper, Icon }) => <div key={label} className="flex items-center gap-4 bg-background px-5 py-5"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{helper}</p></div></div>)}</section>
    <section className="overflow-hidden rounded-xl border bg-background"><div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:justify-between"><div className="relative lg:w-96"><MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employee, route, or vehicle" /></div><div className="flex gap-2"><Select value={department} onChange={setDepartment} options={["All departments", ...departments]} label="Filter by department" /><Select value={status} onChange={setStatus} options={["All statuses", "active", "paused"]} label="Filter by status" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-muted/45 text-xs uppercase text-muted-foreground"><tr>{["Employee", "Transport", "Route & pickup", "Pickup time", "Vehicle", "Status", ""].map(value => <th key={value} className="px-4 py-3 font-medium">{value}</th>)}</tr></thead><tbody className="divide-y">{filtered.map(row => <tr key={row.id} className="hover:bg-muted/30"><td className="px-4 py-4"><p className="font-medium">{row.employee}</p><p className="text-xs text-muted-foreground">{row.employeeNumber} · {row.department || "No department"}</p></td><td className="px-4 py-4">{labels[row.mode]}</td><td className="px-4 py-4"><p className="font-medium">{row.route}</p><p className="text-xs text-muted-foreground">{row.pickupPoint || "No pickup point"}</p></td><td className="px-4 py-4"><span className="inline-flex gap-1.5"><ClockIcon className="h-4 w-4" />{row.pickupTime || "—"}</span></td><td className="px-4 py-4">{row.vehicle || "—"}</td><td className="px-4 py-4"><Badge variant="outline" className={cn(row.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{row.status === "active" ? "Active" : "Paused"}</Badge></td><td className="px-4 py-4"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><EllipsisVerticalIcon className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(row)}><PencilSquareIcon className="mr-2 h-4 w-4" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => void mutate({ action: "set_status", id: row.id, status: row.status === "active" ? "paused" : "active" })}>{row.status === "active" ? "Pause" : "Activate"}</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(row)}><TrashIcon className="mr-2 h-4 w-4" />Remove</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table></div>
      {(loading || !filtered.length) && <div className="px-6 py-16 text-center"><TruckIcon className="mx-auto h-9 w-9 text-muted-foreground/60" /><h2 className="mt-3 font-medium">{loading ? "Loading transportation records…" : "No transportation assignments found"}</h2><p className="mt-1 text-sm text-muted-foreground">{loading ? "Reading the workforce register." : "Add an assignment for an employee to get started."}</p></div>}<div className="border-t px-5 py-3 text-xs text-muted-foreground">Showing {filtered.length} of {assignments.length} assignments</div>
    </section>
  </div>
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-2xl"><form onSubmit={save}><DialogHeader><DialogTitle>{editingId ? "Edit transportation" : "Add transportation"}</DialogTitle><DialogDescription>Assignments are linked to active employees and saved to the workforce register.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><Field label="Employee" required><Select value={form.employeeId} onChange={value => setField("employeeId", value)} options={["", ...employees.map(row => row.id)]} render={value => { const employee = employees.find(row => row.id === value); return employee ? `${employee.preferredName || `${employee.firstName} ${employee.lastName}`} · ${employee.employeeNumber}` : "Select an employee"; }} label="Employee" disabled={Boolean(editingId)} /></Field><Field label="Transport type"><Select value={form.mode} onChange={value => setField("mode", value as Mode)} options={transportModes.map(option => option.value)} render={value => transportModes.find(option => option.value === value)?.label || labels[value as Mode]} label="Transport type" /></Field><Field label="Route" required><Input value={form.route} onChange={e => setField("route", e.target.value)} required /></Field><Field label="Pickup point"><Input value={form.pickupPoint || ""} onChange={e => setField("pickupPoint", e.target.value)} /></Field><Field label="Pickup time"><Input type="time" value={form.pickupTime || ""} onChange={e => setField("pickupTime", e.target.value || null)} /></Field><Field label="Vehicle / allowance"><Input value={form.vehicle || ""} onChange={e => setField("vehicle", e.target.value)} /></Field><Field label="Status"><Select value={form.status} onChange={value => setField("status", value as Status)} options={["active", "paused"]} render={value => value === "active" ? "Active" : "Paused"} label="Status" /></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.employeeId}>{saving ? "Saving…" : editingId ? "Save changes" : "Add assignment"}</Button></DialogFooter></form></DialogContent></Dialog>
  <Dialog open={Boolean(deleteTarget)} onOpenChange={open => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Remove transportation?</DialogTitle><DialogDescription>This removes {deleteTarget?.employee}&apos;s assignment from the workforce register.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={async () => { if (deleteTarget && await mutate({ action: "delete", id: deleteTarget.id })) setDeleteTarget(null); }}>Remove assignment</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>; }
function Select({ value, onChange, options, render = value => value, label, disabled }: { value: string; onChange: (value: string) => void; options: string[]; render?: (value: string) => string; label: string; disabled?: boolean }) { return <select aria-label={label} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm disabled:opacity-60">{options.map(option => <option key={option} value={option}>{render(option)}</option>)}</select>; }
