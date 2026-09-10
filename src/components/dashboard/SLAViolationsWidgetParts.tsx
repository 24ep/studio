"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PositionWithoutSLA, SLAPositionData, SLAStatistics } from "@/lib/slaNotificationService";

import { SLAPositionsList, getSeverityIcon } from "./SLAViolationsPositionLists";
import { SLAComplianceSummary, SLASeverityBreakdown } from "./SLAViolationsSummaryParts";
import { getSLAWidgetDescription } from "./sla-violations-widget-utils";
import type { SLAHeadcountSummaryEntry } from "./use-sla-violations-widget";

export { getSeverityIcon };

function SLACardTitle() {
  return (
    <CardTitle className="flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-orange-500" />
      SLA Monitoring
    </CardTitle>
  );
}

export function SLALoadingCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <SLACardTitle />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

interface SLAErrorCardProps {
  onRetry: () => void;
}

export function SLAErrorCard({ onRetry }: SLAErrorCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <SLACardTitle />
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Error loading SLA data</p>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SLACardHeaderProps {
  actualRecruiterId?: string;
}

export function SLACardHeader({ actualRecruiterId }: SLACardHeaderProps) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <SLACardTitle />
          <CardDescription>{getSLAWidgetDescription(actualRecruiterId)}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

interface SLAWidgetContentProps {
  statistics: SLAStatistics;
  filterSeverity: string;
  filteredPositions: SLAPositionData[];
  hasHeadcounts: boolean;
  positionsWithoutSLA: PositionWithoutSLA[];
  onFilterSeverityChange: (severity: string) => void;
  onOpenPosition: (positionId: string) => void;
  getCountsForPosition: (positionId: string) => SLAHeadcountSummaryEntry[];
}

export function SLAWidgetContent({
  statistics,
  filterSeverity,
  filteredPositions,
  hasHeadcounts,
  positionsWithoutSLA,
  onFilterSeverityChange,
  onOpenPosition,
  getCountsForPosition,
}: SLAWidgetContentProps) {
  return (
    <ScrollArea className="h-full px-6 py-4">
      <div className="space-y-4">
        <SLAComplianceSummary statistics={statistics} />
        <SLASeverityBreakdown
          statistics={statistics}
          positionsWithoutSLACount={positionsWithoutSLA.length}
          filterSeverity={filterSeverity}
          onFilterSeverityChange={onFilterSeverityChange}
        />
        <SLAPositionsList
          filterSeverity={filterSeverity}
          filteredPositions={filteredPositions}
          hasHeadcounts={hasHeadcounts}
          positionsWithoutSLA={positionsWithoutSLA}
          onFilterSeverityChange={onFilterSeverityChange}
          onOpenPosition={onOpenPosition}
          getCountsForPosition={getCountsForPosition}
        />
      </div>
    </ScrollArea>
  );
}
