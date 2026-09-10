"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlatformModule } from "@/lib/types";

export function ProtectedPermissionBadge() {
  return (
    <Badge
      variant="outline"
      className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
    >
      Protected
    </Badge>
  );
}

export function ApprovalRequiredBadge() {
  return (
    <Badge
      variant="outline"
      className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
    >
      Approval Required
    </Badge>
  );
}

export function RiskLevelBadge({
  riskLevel,
}: {
  riskLevel: PlatformModule["riskLevel"];
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        riskLevel === "LOW" &&
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        riskLevel === "MEDIUM" &&
          "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
        riskLevel === "HIGH" &&
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
        riskLevel === "CRITICAL" &&
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
      )}
    >
      {riskLevel}
    </Badge>
  );
}
