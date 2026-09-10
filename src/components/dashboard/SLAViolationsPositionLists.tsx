"use client";

import { Filter } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PositionWithoutSLA, SLAPositionData } from "@/lib/slaNotificationService";

import {
  MonitoredPositionsList,
  PositionsWithoutSLAList,
} from "./SLAViolationsPositionRows";
import type { SLAHeadcountSummaryEntry } from "./use-sla-violations-widget";

export { getSeverityIcon } from "./SLAViolationsPositionRows";

interface SLAPositionsListProps {
  filterSeverity: string;
  filteredPositions: SLAPositionData[];
  hasHeadcounts: boolean;
  positionsWithoutSLA: PositionWithoutSLA[];
  onFilterSeverityChange: (severity: string) => void;
  onOpenPosition: (positionId: string) => void;
  getCountsForPosition: (positionId: string) => SLAHeadcountSummaryEntry[];
}

export function SLAPositionsList({
  filterSeverity,
  filteredPositions,
  hasHeadcounts,
  positionsWithoutSLA,
  onFilterSeverityChange,
  onOpenPosition,
  getCountsForPosition,
}: SLAPositionsListProps) {
  return (
    <div className="space-y-3">
      <SLAPositionsListHeader
        filterSeverity={filterSeverity}
        onFilterSeverityChange={onFilterSeverityChange}
      />

      {filterSeverity === "no_sla" ? (
        <PositionsWithoutSLAList positions={positionsWithoutSLA} onOpenPosition={onOpenPosition} />
      ) : (
        <MonitoredPositionsList
          positions={filteredPositions}
          hasHeadcounts={hasHeadcounts}
          onOpenPosition={onOpenPosition}
          getCountsForPosition={getCountsForPosition}
        />
      )}
    </div>
  );
}

function SLAPositionsListHeader({
  filterSeverity,
  onFilterSeverityChange,
}: {
  filterSeverity: string;
  onFilterSeverityChange: (severity: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium">All Positions</h4>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterSeverity} onValueChange={onFilterSeverityChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="no_sla">No SLA</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
