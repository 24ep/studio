"use client";

import { AlertTriangle, BarChart3, Bell, CheckCircle, Clock, Eye, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSLAHeadcountLabel,
  getSLAHeadcountStatusLabel,
  getSLASeverityIconModel,
} from "./sla-violations-widget-utils";
import type { SLAHeadcountSummaryEntry } from "./use-sla-violations-widget";

export function getSeverityIcon(status: string) {
  const iconModel = getSLASeverityIconModel(status);
  const Icon = {
    "alert-triangle": AlertTriangle,
    "bar-chart": BarChart3,
    bell: Bell,
    "check-circle": CheckCircle,
    flame: Flame,
  }[iconModel.icon];

  return <Icon className={iconModel.className} />;
}

export function EmptyPositionsMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-4">
      <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function HeadcountSummary({ entries }: { entries: SLAHeadcountSummaryEntry[] }) {
  return (
    <div className="mt-1 text-[11px] text-muted-foreground space-y-1">
      {entries.map((group, index) => (
        <div key={`${group.requestDate}-${index}`} className="flex items-center">
          {group.count} {getSLAHeadcountLabel(group.count)}{" "}
          {group.isOverdue ? (
            <span className="text-red-600 dark:text-red-400">
              {getSLAHeadcountStatusLabel(group.isOverdue, group.daysRemaining)}
            </span>
          ) : (
            getSLAHeadcountStatusLabel(group.isOverdue, group.daysRemaining)
          )}
        </div>
      ))}
    </div>
  );
}

export function OpenPositionButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={`${className} h-6 w-6 p-0`}>
      <Eye className="h-3 w-3" />
    </Button>
  );
}

export function ViewAllButton({ label }: { label: string }) {
  return (
    <div className="text-center pt-2">
      <Button variant="outline" size="sm" onClick={() => window.open("/positions", "_blank")}>
        {label}
      </Button>
    </div>
  );
}

export { AlertTriangle };
