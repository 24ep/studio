"use client";

import * as React from "react";
import { toast } from "react-hot-toast";

import { downloadControlledPayrollExport } from "@/lib/payroll/client-export";
import { PayrollWorkspace } from "./PayrollWorkspace";

type PayslipAccessResponse = {
  data?: { access?: { canExport?: boolean } };
  error?: { message?: string };
};

/**
 * Compatibility boundary for the historical Payslips view. The legacy view
 * builds its release-register CSV in the browser, which bypasses the explicit
 * payroll export permission and audit log. This wrapper moves that single bulk
 * export onto the controlled server endpoint and removes the control for users
 * without HR_PAYROLL_EXPORT. It can disappear when Payslips is extracted from
 * PayrollWorkspace into its own component.
 */
export function PayrollPayslipsWorkspace() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [canExport, setCanExport] = React.useState<boolean | null>(null);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/payroll/workspace/payslips", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | PayslipAccessResponse
          | null;
        if (!response.ok) {
          throw new Error(
            payload?.error?.message || "Unable to verify payroll export access.",
          );
        }
        if (!cancelled) setCanExport(Boolean(payload?.data?.access?.canExport));
      } catch {
        if (!cancelled) setCanExport(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || canExport === null) return;

    const syncLegacyExportControl = () => {
      for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
        const label = button.textContent?.trim() || "";
        const isPayslipRegisterExport =
          label === "Export" && Boolean(button.querySelector("svg.lucide-download"));
        if (!isPayslipRegisterExport) continue;
        button.hidden = !canExport;
        button.setAttribute("aria-hidden", canExport ? "false" : "true");
      }
    };

    syncLegacyExportControl();
    const observer = new MutationObserver(syncLegacyExportControl);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [canExport]);

  const exportRegister = React.useCallback(async () => {
    if (exporting) return;
    if (!canExport) {
      toast.error("Payroll export permission required.");
      return;
    }

    const periodSelect = rootRef.current?.querySelector<HTMLSelectElement>(
      'select[aria-label="Payroll period"]',
    );
    const selectedPeriod = periodSelect?.value || "";
    const params = new URLSearchParams();
    if (selectedPeriod && selectedPeriod !== "__all_periods__") {
      params.set("periodId", selectedPeriod);
    }
    const query = params.toString();

    setExporting(true);
    try {
      await downloadControlledPayrollExport(
        `/api/payroll/v1/reports/payslips${query ? `?${query}` : ""}`,
        "payslip-release-register.csv",
      );
      toast.success("Payslip release register exported and audit logged.");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Payslip release register export failed.",
      );
    } finally {
      setExporting(false);
    }
  }, [canExport, exporting]);

  const interceptLegacyPayslipExport = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;

      const label = button.textContent?.trim() || "";
      const isPayslipRegisterExport =
        label === "Export" && Boolean(button.querySelector("svg.lucide-download"));
      if (!isPayslipRegisterExport) return;

      event.preventDefault();
      event.stopPropagation();
      void exportRegister();
    },
    [exportRegister],
  );

  return (
    <div ref={rootRef} onClickCapture={interceptLegacyPayslipExport}>
      <PayrollWorkspace resource="payslips" />
    </div>
  );
}
