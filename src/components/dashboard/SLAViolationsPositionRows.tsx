"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PositionWithoutSLA, SLAPositionData } from "@/lib/slaNotificationService";

import {
  getSLABadgeVariant,
  getSLASeverityColor,
  getSLAStatusLabel,
  getSLAViewAllNoSlaPositionsLabel,
  getSLAViewAllPositionsLabel,
  hasHiddenSLAPositions,
  SLA_POSITION_PREVIEW_LIMIT,
} from "./sla-violations-widget-utils";
import {
  EmptyPositionsMessage,
  getSeverityIcon,
  HeadcountSummary,
  OpenPositionButton,
  ViewAllButton,
} from "./SLAViolationsPositionRowParts";
import type { SLAHeadcountSummaryEntry } from "./use-sla-violations-widget";

export { getSeverityIcon } from "./SLAViolationsPositionRowParts";

export function PositionsWithoutSLAList({
  positions,
  onOpenPosition,
}: {
  positions: PositionWithoutSLA[];
  onOpenPosition: (positionId: string) => void;
}) {
  if (positions.length === 0) {
    return <EmptyPositionsMessage message="No positions without SLA found" />;
  }

  return (
    <div className="space-y-2">
      {positions.slice(0, SLA_POSITION_PREVIEW_LIMIT).map((position) => (
        <PositionWithoutSLARow
          key={position.positionId}
          position={position}
          onOpenPosition={onOpenPosition}
        />
      ))}
      {hasHiddenSLAPositions(positions.length) && (
        <ViewAllButton label={getSLAViewAllNoSlaPositionsLabel(positions.length)} />
      )}
    </div>
  );
}

export function MonitoredPositionsList({
  positions,
  hasHeadcounts,
  onOpenPosition,
  getCountsForPosition,
}: {
  positions: SLAPositionData[];
  hasHeadcounts: boolean;
  onOpenPosition: (positionId: string) => void;
  getCountsForPosition: (positionId: string) => SLAHeadcountSummaryEntry[];
}) {
  if (positions.length === 0) {
    return <EmptyPositionsMessage message="No positions found" />;
  }

  return (
    <div className="space-y-2">
      {positions.slice(0, SLA_POSITION_PREVIEW_LIMIT).map((position) => (
        <MonitoredPositionRow
          key={position.positionId}
          position={position}
          hasHeadcounts={hasHeadcounts}
          counts={getCountsForPosition(position.positionId)}
          onOpenPosition={onOpenPosition}
        />
      ))}
      {hasHiddenSLAPositions(positions.length) && (
        <ViewAllButton label={getSLAViewAllPositionsLabel(positions.length)} />
      )}
    </div>
  );
}

function PositionWithoutSLARow({
  position,
  onOpenPosition,
}: {
  position: PositionWithoutSLA;
  onOpenPosition: (positionId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h4 className="font-medium text-xs truncate">{position.positionTitle}</h4>
          <Badge variant="outline" className="text-xs">
            No SLA
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{position.department}</span>
          {position.recruiterName && (
            <>
              <span>-</span>
              <span>{position.recruiterName}</span>
            </>
          )}
        </div>
      </div>
      <OpenPositionButton onClick={() => onOpenPosition(position.positionId)} />
    </div>
  );
}

function MonitoredPositionRow({
  position,
  hasHeadcounts,
  counts,
  onOpenPosition,
}: {
  position: SLAPositionData;
  hasHeadcounts: boolean;
  counts: SLAHeadcountSummaryEntry[];
  onOpenPosition: (positionId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{getSeverityIcon(position.status)}</span>
          <h4 className="font-medium text-xs truncate">{position.positionTitle}</h4>
          <Badge variant={getSLABadgeVariant(position.status)} className="text-xs">
            {getSLAStatusLabel(position.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {position.gradeName}
          </Badge>
          {position.isViolated && (
            <>
              <span>-</span>
              <span className={getSLASeverityColor(position.status)}>
                {position.daysOverdue} days overdue
              </span>
            </>
          )}
        </div>
        {hasHeadcounts && <HeadcountSummary entries={counts} />}
      </div>
      <OpenPositionButton onClick={() => onOpenPosition(position.positionId)} className="ml-2" />
    </div>
  );
}
