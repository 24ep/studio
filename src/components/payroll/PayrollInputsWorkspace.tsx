"use client";

import * as React from "react";
import { Check, Plus, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PayrollEmpty, PayrollError, PayrollSkeleton, PayrollStatus } from "./PayrollPrimitives";

type Row = Record<string, unknown>;
type Payload = {
  records: Row[];
  employees: Row[];
  access: { canManage: boolean; canApprove: boolean };
};

const inputTypes = [
  ["earning", "Earning"],
  ["pre_tax_deduction", "Pre-tax deduction"],
  ["post_tax_deduction", "Post-tax deduction"],
  ["tax", "Tax"],
] as const;

function money(value: unknown, currency: unknown = "THB") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "THB"),
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function PayrollInputsWorkspace() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<{ row: Row; action: "approve" | "reject" | "cancel" } | null>(null);
  const [decisionReason, setDecisionReason] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [form, setForm] = React.useState({
    employeeId: "",
    inputType: "earning",
    componentCode: "ADJUSTMENT",
    amount: "",
    currency: "THB",
    effectiveDate: new Date().toISOString().slice(0, 10),
    taxable: false,
    reason: "",
  });

  const load = React.useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/payroll/v1/inputs", { cache: "no-store", credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to load payroll inputs.");
      setData(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load payroll inputs.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const records = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.records || []).filter(row => {
      const rowStatus = String(row.status || "pending");
      const matchesStatus = status === "all" || rowStatus === status;
      const text = `${row.employee_name || ""} ${row.employee_number || ""} ${row.component_code || ""} ${row.source_module || ""}`.toLowerCase();
      return matchesStatus && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [data?.records, query, status]);

  async function createAdjustment(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.access.canManage || busy) return;
    setBusy("create");
    try {
      const response = await fetch("/api/payroll/v1/inputs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), taxable: form.inputType === "earning" ? form.taxable : false }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to create payroll adjustment.");
      toast.success("Payroll adjustment created for approval.");
      setCreateOpen(false);
      setForm(current => ({ ...current, amount: "", reason: "", componentCode: "ADJUSTMENT" }));
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to create payroll adjustment.");
    } finally {
      setBusy("");
    }
  }

  async function submitDecision() {
    if (!decision || decisionReason.trim().length < 2 || busy) return;
    setBusy(`decision-${String(decision.row.id)}`);
    try {
      const response = await fetch("/api/payroll/v1/inputs", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: decision.row.id, action: decision.action, reason: decisionReason.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Unable to update payroll adjustment.");
      toast.success(`Adjustment ${decision.action === "approve" ? "approved" : decision.action === "reject" ? "rejected" : "cancelled"}.`);
      setDecision(null);
      setDecisionReason("");
      await load();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to update payroll adjustment.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <main className="min-h-full p-4 sm:p-6"><PayrollSkeleton /></main>;
  if (error || !data) return <main className="min-h-full p-4 sm:p-6"><PayrollError message={error || "Payroll inputs are unavailable."} onRetry={() => void load()} /></main>;

  const pending = data.records.filter(row => ["pending", "pending_approval"].includes(String(row.status))).length;
  const ready = data.records.filter(row => String(row.status) === "ready").length;
  const attached = data.records.filter(row => Boolean(row.payroll_run_id)).length;

  return (
    <main className="min-h-full bg-background text-foreground">
      <header className="border-b border-border px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Governed payroll inputs</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Inputs & adjustments</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Create one-time earnings, deductions, taxes, and corrections. Manual inputs require a separate payroll approver before a run can collect them.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            {data.access.canManage ? <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />New adjustment</Button> : null}
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid border-y border-border sm:grid-cols-3">
          {[["Pending approval", pending], ["Ready for collection", ready], ["Attached to a run", attached]].map(([label, value], index) => (
            <div key={String(label)} className={`px-4 py-4 ${index ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search employee or component" className="max-w-sm" />
              <select value={status} onChange={event => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{records.length} records</p>
          </div>

          {records.length ? (
            <div className="overflow-x-auto border border-border bg-card">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr><th className="px-3 py-2">Employee</th><th className="px-3 py-2">Component</th><th className="px-3 py-2">Type</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Effective</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map(row => {
                    const isPending = ["pending", "pending_approval"].includes(String(row.status));
                    return (
                      <tr key={String(row.id)} className="hover:bg-muted/30">
                        <td className="px-3 py-3"><p className="font-semibold">{String(row.employee_name || "Employee")}</p><p className="text-muted-foreground">{String(row.employee_number || "")}</p></td>
                        <td className="px-3 py-3 font-medium">{String(row.component_code || "—").replaceAll("_", " ")}</td>
                        <td className="px-3 py-3 capitalize">{String(row.input_type || "").replaceAll("_", " ")}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(row.amount, row.currency)}</td>
                        <td className="px-3 py-3">{row.effective_date ? new Date(String(row.effective_date)).toLocaleDateString() : "—"}</td>
                        <td className="px-3 py-3 capitalize">{String(row.source_module || "manual")}</td>
                        <td className="px-3 py-3"><PayrollStatus value={row.status} /></td>
                        <td className="px-3 py-3"><div className="flex justify-end gap-1">
                          {isPending && data.access.canApprove ? <><Button size="sm" variant="outline" onClick={() => { setDecision({ row, action: "approve" }); setDecisionReason(""); }}><Check className="mr-1 h-3.5 w-3.5" />Approve</Button><Button size="sm" variant="outline" onClick={() => { setDecision({ row, action: "reject" }); setDecisionReason(""); }}><X className="mr-1 h-3.5 w-3.5" />Reject</Button></> : null}
                          {isPending && data.access.canManage ? <Button size="sm" variant="ghost" onClick={() => { setDecision({ row, action: "cancel" }); setDecisionReason(""); }}>Cancel</Button> : null}
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <PayrollEmpty title="No payroll inputs match" description="Create an adjustment or change the filters." />}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>New payroll adjustment</DialogTitle><DialogDescription>The adjustment stays pending until a different authorized approver reviews it.</DialogDescription></DialogHeader>
          <form onSubmit={createAdjustment} className="grid gap-4 py-2">
            <label className="grid gap-2 text-sm font-medium">Employee<select required value={form.employeeId} onChange={event => setForm(current => ({ ...current, employeeId: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3"><option value="">Select employee</option>{data.employees.map(employee => <option key={String(employee.id)} value={String(employee.id)}>{String(employee.name)} · {String(employee.employee_number || "")}</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">Input type<select value={form.inputType} onChange={event => setForm(current => ({ ...current, inputType: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3">{inputTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-medium">Component code<Input required value={form.componentCode} onChange={event => setForm(current => ({ ...current, componentCode: event.target.value.toUpperCase().replace(/\s+/g, "_") }))} /></label>
              <label className="grid gap-2 text-sm font-medium">Amount<Input required min="0.01" step="0.01" type="number" value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))} /></label>
              <label className="grid gap-2 text-sm font-medium">Effective date<Input required type="date" value={form.effectiveDate} onChange={event => setForm(current => ({ ...current, effectiveDate: event.target.value }))} /></label>
            </div>
            {form.inputType === "earning" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.taxable} onChange={event => setForm(current => ({ ...current, taxable: event.target.checked }))} />Treat this earning as taxable</label> : null}
            <label className="grid gap-2 text-sm font-medium">Reason<Input required minLength={2} value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} placeholder="Why this adjustment is needed" /></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={busy === "create" || !form.employeeId || !form.amount || form.reason.trim().length < 2}>{busy === "create" ? "Creating…" : "Create for approval"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(decision)} onOpenChange={open => { if (!open) { setDecision(null); setDecisionReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="capitalize">{decision?.action} payroll adjustment</DialogTitle><DialogDescription>Record the reason for this governed payroll decision. It will be retained in the adjustment metadata and audit log.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2"><div className="rounded-md border border-border bg-muted/30 p-3 text-sm"><p className="font-semibold">{String(decision?.row.employee_name || "Employee")}</p><p className="mt-1 text-muted-foreground">{String(decision?.row.component_code || "Adjustment")} · {money(decision?.row.amount, decision?.row.currency)}</p></div><label className="grid gap-2 text-sm font-medium">Decision reason<Input autoFocus value={decisionReason} onChange={event => setDecisionReason(event.target.value)} placeholder="Enter the review note" /></label></div>
          <DialogFooter><Button variant="outline" onClick={() => setDecision(null)}>Back</Button><Button onClick={() => void submitDecision()} disabled={decisionReason.trim().length < 2 || Boolean(busy)}>{busy ? "Saving…" : "Confirm decision"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
