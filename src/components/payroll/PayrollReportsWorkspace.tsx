"use client";

import * as React from "react";
import { Download, FileSpreadsheet, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useLocalization } from "@/contexts/LocalizationContext";
import { downloadControlledPayrollExport } from "@/lib/payroll/client-export";
import type { PayrollWorkspacePayload } from "@/lib/payroll/contracts";
import {
  MetricStrip,
  Money,
  PayrollEmpty,
  PayrollError,
  PayrollSkeleton,
  PayrollStatus,
  SectionHeading,
} from "./PayrollPrimitives";

const date = (value: unknown) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleDateString("en-GB");
};

export function PayrollReportsWorkspace() {
  const { t } = useLocalization();
  const [data, setData] = React.useState<PayrollWorkspacePayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/payroll/workspace/reports", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.error?.message ||
            t("payroll.errors.loadFailed", "Unable to load Payroll."),
        );
      }
      setData(payload.data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("payroll.errors.loadFailed", "Unable to load Payroll."),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const exportRegister = React.useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadControlledPayrollExport(
        "/api/payroll/v1/reports/register",
        "payroll-register.csv",
      );
      toast.success("Payroll register exported and audit logged.");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Payroll register export failed.",
      );
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  if (loading) {
    return (
      <main className="min-h-full bg-[#f7f8fa] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 dark:bg-[#0b1019] dark:text-slate-50">
        <PayrollSkeleton />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-full bg-[#f7f8fa] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 dark:bg-[#0b1019] dark:text-slate-50">
        <PayrollError message={error || "Payroll reports are unavailable."} onRetry={() => void load()} />
      </main>
    );
  }

  return (
    <main
      id="payroll-main"
      className="min-h-full bg-[#f7f8fa] text-slate-950 dark:bg-[#0b1019] dark:text-slate-50"
    >
      <div className="border-b border-slate-200 bg-[#f1f4f7] px-4 py-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-[#111824]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {t("payroll.reportsEyebrow", "Controlled financial output")}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">
              {t("payroll.reportsTitle", "Reports")}
            </h1>
            <p className="mt-1 max-w-[80ch] text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t(
                "payroll.reportsDescription",
                "Company-scoped payroll registers, financial controls, and authorized exports. Every register download is generated on the server and audit logged.",
              )}
            </p>
          </div>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh", "Refresh")}
          </Button>
        </div>
      </div>

      <div className="space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Controlled export boundary</p>
            <p className="mt-0.5 text-xs leading-5 opacity-80">
              Register files are generated from the authoritative company-scoped server dataset. Export permission is checked again at download time and the event is written to the audit log.
            </p>
          </div>
        </div>

        <MetricStrip
          items={[
            {
              label: t("payroll.reports.reportedPeriods", "Reported periods"),
              value: Number(data.summary.periods || 0),
            },
            {
              label: t("payroll.reports.grossPayroll", "Gross payroll"),
              value: <Money value={data.summary.gross} />,
            },
            {
              label: t("payroll.reports.netPayroll", "Net payroll"),
              value: <Money value={data.summary.net} />,
            },
            {
              label: t(
                "payroll.reports.pendingReconciliation",
                "Pending internal reconciliation",
              ),
              value: Number(data.summary.pendingReconciliation || 0),
              intent: Number(data.summary.pendingReconciliation)
                ? "danger"
                : "positive",
            },
          ]}
        />

        <section className="space-y-4">
          <SectionHeading
            title={t("payroll.section.payrollRegister", "Payroll register")}
            description={t(
              "payroll.section.payrollRegisterDescription",
              "The table and CSV use the same authoritative company-scoped payroll dataset.",
            )}
            action={
              data.access.canExport ? (
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={exporting}
                  onClick={() => void exportRegister()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting
                    ? t("payroll.action.exporting", "Exporting…")
                    : t("payroll.action.exportCsv", "Export CSV")}
                </Button>
              ) : undefined
            }
          />

          {data.records.length ? (
            <div className="overflow-x-auto border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Pay date</th>
                    <th className="px-3 py-2">Run type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Employees</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                    <th className="px-3 py-2 text-right">Deductions</th>
                    <th className="px-3 py-2 text-right">Net</th>
                    <th className="px-3 py-2">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.records.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="px-3 py-3 font-semibold">{String(row.period_name || "—")}</td>
                      <td className="px-3 py-3">{date(row.pay_date)}</td>
                      <td className="px-3 py-3 capitalize">{String(row.run_type || "regular").replaceAll("_", " ")}</td>
                      <td className="px-3 py-3"><PayrollStatus value={row.status} /></td>
                      <td className="px-3 py-3 text-right tabular-nums">{Number(row.employee_count || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-right"><Money value={row.gross_total} /></td>
                      <td className="px-3 py-3 text-right"><Money value={row.total_deductions} /></td>
                      <td className="px-3 py-3 text-right"><Money value={row.net_total} /></td>
                      <td className="px-3 py-3"><PayrollStatus value={row.reconciliation_status || "pending"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PayrollEmpty
              title={t("payroll.empty.noReportablePayroll", "No reportable payroll")}
              description={t(
                "payroll.empty.noReportablePayrollDescription",
                "Finalized and in-progress payroll runs will populate the register without synthetic values.",
              )}
            />
          )}
        </section>

        <section className="space-y-4">
          <SectionHeading
            title={t(
              "payroll.section.financialOutputHistory",
              "Financial output history",
            )}
            description={t(
              "payroll.section.financialOutputHistoryDescription",
              "Generated payment, accounting, statutory, and reconciliation outputs remain linked to their source payroll period.",
            )}
          />
          {data.secondary.length ? (
            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-3 dark:border-slate-800 dark:bg-slate-800">
              {data.secondary.map((item, index) => (
                <article
                  key={`${item.id || item.reference}-${index}`}
                  className="bg-white p-5 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-[#315d87] dark:text-blue-300" aria-hidden="true" />
                    <PayrollStatus value={item.status} />
                  </div>
                  <h3 className="mt-4 font-bold capitalize">
                    {String(item.export_type || item.reference || "Payroll output").replaceAll("_", " ")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {String(item.period_name || date(item.accounting_date))}
                  </p>
                  {item.total_debit !== undefined && (
                    <p className="mt-4 text-sm">
                      <Money value={item.total_debit} /> debit · <Money value={item.total_credit} /> credit
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <PayrollEmpty
              title={t("payroll.empty.noGeneratedOutputs", "No generated outputs")}
              description={t(
                "payroll.empty.noGeneratedOutputsDescription",
                "Payment, accounting, statutory, and reconciliation outputs appear after payroll finalization.",
              )}
            />
          )}
        </section>
      </div>
    </main>
  );
}
