"use client";

import type { KeyboardEvent } from "react";

import type { SLAStatistics } from "@/lib/slaNotificationService";

import {
  buildSLASeverityTiles,
  getSLAComplianceColorClass,
  getSLASeverityTileClassName,
  getSLAViolationCount,
  type SLASeverityTone,
} from "./sla-violations-widget-utils";

function handleKeyboardClick(event: KeyboardEvent<HTMLElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}

interface SLAComplianceSummaryProps {
  statistics: SLAStatistics;
}

export function SLAComplianceSummary({ statistics }: SLAComplianceSummaryProps) {
  const complianceColor = getSLAComplianceColorClass(statistics.complianceRate);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">SLA Compliance Rate</span>
        <span className="text-sm text-muted-foreground">
          {Number(statistics.complianceRate).toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all ${complianceColor}`}
          style={{ width: `${statistics.complianceRate}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {statistics.onTrack} positions on track, {getSLAViolationCount(statistics)} violations
      </p>
    </div>
  );
}

interface SLASeverityTileProps {
  label: string;
  value: number;
  tone: SLASeverityTone;
  active: boolean;
  onClick: () => void;
}

function SLASeverityTile({ label, value, tone, active, onClick }: SLASeverityTileProps) {
  return (
    <div
      className={getSLASeverityTileClassName(tone, active)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyboardClick}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

interface SLASeverityBreakdownProps {
  statistics: SLAStatistics;
  positionsWithoutSLACount: number;
  filterSeverity: string;
  onFilterSeverityChange: (severity: string) => void;
}

export function SLASeverityBreakdown({
  statistics,
  positionsWithoutSLACount,
  filterSeverity,
  onFilterSeverityChange,
}: SLASeverityBreakdownProps) {
  const severityTiles = buildSLASeverityTiles(statistics, positionsWithoutSLACount);

  return (
    <div className="grid grid-cols-5 gap-3">
      {severityTiles.map((tile) => (
        <SLASeverityTile
          key={tile.severity}
          label={tile.label}
          value={tile.value}
          tone={tile.tone}
          active={filterSeverity === tile.severity}
          onClick={() => onFilterSeverityChange(tile.severity)}
        />
      ))}
    </div>
  );
}
