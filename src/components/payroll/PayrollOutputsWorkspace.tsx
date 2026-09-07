"use client";

import * as React from "react";
import { Download, FileSpreadsheet, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PayrollWorkspacePayload } from "@/lib/payroll/contracts";
import { PayrollEmpty, PayrollError, PayrollSkeleton, PayrollStatus } from "./PayrollPrimitives";

type Row = Record<string, unknown>;

const outputTypes = [
  { id: "bank", label: "Bank file", description: "Employee payment instructions" },
  { id: "accounting", label: "Accounting", description: "Payroll journal / accounting lines" },
  { id: "statutory", label: "PND.1 / Tax", description: "Thai payroll tax output" },
  { id: "sso", label: "SSO 1-10", description: "Social Security contribution detail" },
] as const;

function downloadable(row: Row) {
  return ["payment_processing", "paid", "reconciled", "closed"].includes(String(row.status));
}

function outputAllowed(row: Row, type: string) {
  if (String(row.run_type || "").toLowerCase() !== "reversal") return true;
  return type === "accounting";
}

export function PayrollOutputsWorkspace() {
  const [data, setData] = React.useState<PayrollWorkspacePayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/payroll/workspace/reports", { cache: "no-store", credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || "Unable to load payroll outputs.");
      setData(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load payroll outputs.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.records || []).filter(row => !q || `${row.period_name || ""} ${row.run_type || ""} ${row.status || ""} ${row.id || ""}`.toLowerCase().includes(q));
  }, [data?.records, query]);

  if (loading) return <main className="min-h-full p-4 sm:p-6"><PayrollSkeleton /></main>;
  if (error || !data) return <main className="min-h-full p-4 sm:p-6"><PayrollError message={error || "Payroll outputs are unavailable."} onRetry={() => void load()} /></main>;

  return (
    <main className="min-h-full bg-background text-foreground">
      <header className="border-b border-border px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Controlled payroll artifacts</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Outputs</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Download bank, accounting, PND.1 and SSO artifacts from one controlled workspace. Access is company scoped and each download is checked and audit logged by the server.</p>
          </div>
          <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><p className="font-semibold">External settlement remains explicit</p><p className="mt-0.5 text-xs text-muted-foreground">Bank files are prepared here; the bank moves money outside Hrive. Return to Payroll Runs to record settlement evidence, reconcile, and close.</p></div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search period, run or status" className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-xs text-muted-foreground">{rows.length} payroll runs</span>
        </div>

        {rows.length ? (
          <div className="space-y-3">
            {rows.map(row => (
              <article key={String(row.id)} className="border border-border bg-card">
                <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{String(row.period_name || "Payroll run")}</h2><PayrollStatus value={row.status} /></div><p className="mt-1 text-xs text-muted-foreground">{String(row.run_type || "regular").replaceAll("_", " ")} · {String(row.id)}</p></div>
                  <Button asChild variant="ghost" size="sm"><a href={`/payroll/runs`}>Open run</a></Button>
                </header>
                <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                  {outputTypes.map(type => {
                    const enabled = data.access.canExport && downloadable(row) && outputAllowed(row, type.id);
                    return (
                      <div key={type.id} className="flex min-h-32 flex-col bg-background p-4">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        <p className="mt-3 text-sm font-semibold">{type.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
                        {enabled ? (
                          <Button asChild variant="outline" size="sm" className="mt-auto self-start"><a href={`/api/payroll/v1/runs/${String(row.id)}/exports/${type.id}`}><Download className="mr-2 h-3.5 w-3.5" />Download</a></Button>
                        ) : (
                          <p className="mt-auto text-[11px] text-muted-foreground">{!data.access.canExport ? "Export permission required" : !downloadable(row) ? "Generate outputs first" : "Not applicable to this run type"}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : <PayrollEmpty title="No payroll outputs match" description="Finalized runs will become downloadable after outputs are generated." />}
      </div>
    </main>
  );
}
