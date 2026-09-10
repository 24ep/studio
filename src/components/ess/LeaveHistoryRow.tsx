import {
  BriefcaseBusiness,
  CalendarDays,
  HeartPulse,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "./EssShared";
import type { EssRow } from "./ess-types";
import { dateValue, statusLabel, stringValue } from "./ess-types";

export function LeaveHistoryRow({
  request,
  policy,
  onView,
}: {
  request: EssRow;
  policy?: EssRow;
  onView: () => void;
}) {
  const type = String(policy?.leave_type || policy?.name || "").toLowerCase();
  const Icon = type.includes("sick")
    ? HeartPulse
    : type.includes("personal")
      ? CalendarDays
      : BriefcaseBusiness;
  const days = Number(request.days || 0);
  const submitted = request.submitted_at || request.created_at;
  return (
    <article className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/20 md:grid-cols-[1.2fr_1.25fr_.8fr_.8fr_.9fr_1fr_auto] md:items-center md:gap-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Icon
          className={`h-5 w-5 shrink-0 ${type.includes("sick") ? "text-sky-400" : type.includes("personal") ? "text-rose-400" : "text-amber-400"}`}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {stringValue(policy?.name, "Leave")}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
            {dateValue(request.start_date)} – {dateValue(request.end_date)}
          </p>
        </div>
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-medium">
          {dateValue(request.start_date)} – {dateValue(request.end_date)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {statusLabel(request.request_unit)}
        </p>
      </div>
      <p className="hidden text-sm md:block">
        {days.toFixed(1).replace(".0", "")} {days === 1 ? "day" : "days"}
      </p>
      <div>
        <StatusBadge status={request.status} />
      </div>
      <div className="hidden md:block">
        <p className="text-sm">{dateValue(submitted)}</p>
        {request.status === "draft" && (
          <p className="text-xs text-muted-foreground">Last edited</p>
        )}
      </div>
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-sm">
          {stringValue(request.acting_employee_name, "—")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {stringValue(request.acting_employee_job_title, "No coverage")}
        </p>
      </div>
      <div className="flex items-center gap-1 md:justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={onView}
        >
          View
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`More actions for ${stringValue(policy?.name, "leave request")}`}
          onClick={onView}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
