import { getJsonArray, isJsonObject } from "../../lib/response-json";
import type { JsonObject } from "../../lib/json-types";
import type {
  SLAPositionData,
  SLAStatistics,
} from "@/lib/slaNotificationService";
import { buildSLAHeadcountSummaryForPosition } from "./sla-headcount-summary-utils";

export { buildSLAHeadcountSummaryForPosition };
export type { SLAHeadcountSummaryEntry } from "./sla-headcount-summary-utils";

export type SLASeverityStatus = "urgent" | "critical" | "warning" | "on_track" | "no_sla";
export type SLASeverityTone = "green" | "yellow" | "orange" | "red" | "gray";
export type SLASeverityIconName = "flame" | "bell" | "alert-triangle" | "check-circle" | "bar-chart";
export type SLABadgeVariant = "default" | "destructive";

export const SLA_POSITION_PREVIEW_LIMIT = 5;

export interface SLASeverityTileModel {
  label: string;
  severity: SLASeverityStatus;
  tone: SLASeverityTone;
  value: number;
}

export interface SLASeverityIconModel {
  icon: SLASeverityIconName;
  className: string;
}

export function getSLAResponseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function getSLAResponseJsonArray<T>(data: JsonObject, key: string): T[] {
  return getSLAResponseArray<T>(getJsonArray(data, key));
}

export function getSLAStatistics(value: unknown): SLAStatistics | null {
  return isJsonObject(value) ? value as unknown as SLAStatistics : null;
}

export function filterSLAPositionsBySeverity(
  positions: SLAPositionData[],
  filterSeverity: string,
) {
  if (filterSeverity === "all") return positions;
  if (filterSeverity === "no_sla") return [];

  return positions.filter((position) => position.status === filterSeverity);
}

export function getSLASeverityColor(status: string) {
  switch (status) {
    case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    case "critical": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
    case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    case "on_track": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
}

export function getSLAStatusLabel(status: string) {
  switch (status) {
    case "urgent": return "Urgent";
    case "critical": return "Critical";
    case "warning": return "Warning";
    case "on_track": return "On Track";
    default: return "Unknown";
  }
}

export function getSLABadgeVariant(status: string): SLABadgeVariant {
  return status === "on_track" ? "default" : "destructive";
}

export function getSLASeverityIconModel(status: string): SLASeverityIconModel {
  switch (status) {
    case "urgent": return { icon: "flame", className: "h-4 w-4 text-red-500" };
    case "critical": return { icon: "bell", className: "h-4 w-4 text-red-600" };
    case "warning": return { icon: "alert-triangle", className: "h-4 w-4 text-yellow-500" };
    case "on_track": return { icon: "check-circle", className: "h-4 w-4 text-green-500" };
    default: return { icon: "bar-chart", className: "h-4 w-4 text-gray-500" };
  }
}

export function getSLAComplianceColorClass(complianceRate: number) {
  if (complianceRate >= 90) return "bg-green-500";
  if (complianceRate >= 70) return "bg-yellow-500";
  if (complianceRate >= 50) return "bg-orange-500";

  return "bg-red-500";
}

export function buildSLASeverityTiles(
  statistics: SLAStatistics,
  positionsWithoutSLACount: number
): SLASeverityTileModel[] {
  return [
    { label: "On Track", severity: "on_track", tone: "green", value: statistics.onTrack },
    { label: "Warning", severity: "warning", tone: "yellow", value: statistics.warning },
    { label: "Critical", severity: "critical", tone: "orange", value: statistics.critical },
    { label: "Urgent", severity: "urgent", tone: "red", value: statistics.urgent },
    { label: "No SLA", severity: "no_sla", tone: "gray", value: positionsWithoutSLACount },
  ];
}

export function getSLASeverityTileClassName(tone: SLASeverityTone, active: boolean) {
  const toneClasses: Record<SLASeverityTone, string> = {
    green: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 ring-green-500",
    yellow: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 ring-yellow-500",
    orange: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 ring-orange-500",
    red: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 ring-red-500",
    gray: "bg-gray-50 dark:bg-gray-950/20 text-gray-600 dark:text-gray-400 ring-gray-500",
  };
  const activeClass = active ? "ring-2 shadow-lg" : "";

  return `text-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${toneClasses[tone]} ${activeClass}`;
}

export function getSLAWidgetDescription(actualRecruiterId?: string) {
  return actualRecruiterId
    ? "Your positions with SLA monitoring"
    : "All positions with SLA monitoring";
}

export function getSLAViolationCount(statistics: Pick<SLAStatistics, "total" | "onTrack">) {
  return statistics.total - statistics.onTrack;
}

export function getSLAHeadcountLabel(count: number) {
  return `headcount${count > 1 ? "s" : ""}`;
}

export function getSLAHeadcountStatusLabel(isOverdue: boolean, daysRemaining: number | null) {
  return isOverdue ? "overdue" : `${daysRemaining} days remain`;
}

export function hasHiddenSLAPositions(totalPositions: number) {
  return totalPositions > SLA_POSITION_PREVIEW_LIMIT;
}

export function getSLAViewAllPositionsLabel(totalPositions: number) {
  return `View all ${totalPositions} positions`;
}

export function getSLAViewAllNoSlaPositionsLabel(totalPositions: number) {
  return `View all ${totalPositions} positions without SLA`;
}
