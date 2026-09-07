"use client";

import { useEffect, useState } from "react";
import { Calculator, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type ApprovalRoute = Record<string, unknown>;
type OperationsConfig = Record<string, unknown> & {
  overtimeMultiplier?: number;
  standardHoursPerDay?: number;
  salaryDaysPerMonth?: number;
};

type PayrollConfigurationResponse = {
  routes?: ApprovalRoute[];
  operations?: OperationsConfig;
  message?: string;
};

const defaults = {
  overtimeMultiplier: 1.5,
  standardHoursPerDay: 8,
  salaryDaysPerMonth: 30,
};

export function PayrollCalculationAssumptionsCard({ canEdit }: { canEdit: boolean }) {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([]);
  const [operations, setOperations] = useState<OperationsConfig>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/settings/payroll-approval-routes", {
          cache: "no-store",
          credentials: "include",
        });
        const payload = (await response.json().catch(() => ({}))) as PayrollConfigurationResponse;
        if (!response.ok) throw new Error(payload.message || "Unable to load payroll calculation settings.");
        if (!active) return;
        setRoutes(payload.routes || []);
        setOperations({
          ...(payload.operations || {}),
          overtimeMultiplier: Number(payload.operations?.overtimeMultiplier ?? defaults.overtimeMultiplier),
          standardHoursPerDay: Number(payload.operations?.standardHoursPerDay ?? defaults.standardHoursPerDay),
          salaryDaysPerMonth: Number(payload.operations?.salaryDaysPerMonth ?? defaults.salaryDaysPerMonth),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load payroll calculation settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateNumber = (key: keyof typeof defaults, value: string) => {
    setOperations(current => ({ ...current, [key]: Number(value) }));
  };

  const save = async () => {
    if (!routes.length) {
      toast.error("Payroll approval routes must load before calculation settings can be saved.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/settings/payroll-approval-routes", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes, operations }),
      });
      const payload = (await response.json().catch(() => ({}))) as PayrollConfigurationResponse;
      if (!response.ok) throw new Error(payload.message || "Unable to save payroll calculation settings.");
      if (payload.operations) setOperations(payload.operations);
      toast.success("Payroll calculation assumptions saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save payroll calculation settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto mb-4 max-w-[1120px] rounded-md border border-border bg-card p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-3 h-4 w-3/4" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mb-4 max-w-[1120px] rounded-md border border-border bg-card p-5 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Calculator className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Payroll calculation assumptions</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              These values convert approved attendance overtime and unpaid leave into payroll amounts. Review them against your employment policy before running payroll.
            </p>
          </div>
        </div>
        <Button size="sm" disabled={!canEdit || saving} onClick={() => void save()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save assumptions
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-medium">
          Overtime multiplier
          <Input
            type="number"
            min="0.01"
            max="10"
            step="0.1"
            disabled={!canEdit}
            value={Number(operations.overtimeMultiplier ?? defaults.overtimeMultiplier)}
            onChange={event => updateNumber("overtimeMultiplier", event.target.value)}
          />
          <span className="font-normal text-muted-foreground">Applied to the employee hourly base rate for approved overtime.</span>
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Standard work hours / day
          <Input
            type="number"
            min="0.01"
            max="24"
            step="0.25"
            disabled={!canEdit}
            value={Number(operations.standardHoursPerDay ?? defaults.standardHoursPerDay)}
            onChange={event => updateNumber("standardHoursPerDay", event.target.value)}
          />
          <span className="font-normal text-muted-foreground">Used with salary days/month to derive the hourly base rate.</span>
        </label>
        <label className="grid gap-1.5 text-xs font-medium">
          Salary days / month
          <Input
            type="number"
            min="0.01"
            max="31"
            step="0.5"
            disabled={!canEdit}
            value={Number(operations.salaryDaysPerMonth ?? defaults.salaryDaysPerMonth)}
            onChange={event => updateNumber("salaryDaysPerMonth", event.target.value)}
          />
          <span className="font-normal text-muted-foreground">Used to derive daily unpaid-leave deductions and the hourly base rate.</span>
        </label>
      </div>
    </section>
  );
}
