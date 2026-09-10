import * as React from "react";
import { Check, Circle, Clock3 } from "lucide-react";

import { Label } from "@/components/ui/label";

export function LeaveField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function LeaveCalculation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function LeaveBalance({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value.toFixed(1)}
      </p>
    </div>
  );
}

export function LeaveRequestDetail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

export function LeaveApprovalStep({
  label,
  detail,
  state,
  last = false,
}: {
  label: string;
  detail: string;
  state: "done" | "current" | "pending";
  last?: boolean;
}) {
  const Icon = state === "done" ? Check : state === "current" ? Clock3 : Circle;
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <span
          className="absolute left-3 top-6 h-full border-l border-dashed border-border"
          aria-hidden
        />
      )}
      <span
        className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full border ${state === "done" ? "border-primary bg-primary text-primary-foreground" : state === "current" ? "border-primary bg-background text-primary" : "border-border bg-background text-muted-foreground"}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
