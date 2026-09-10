"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PositionDetailDrawer } from "@/components/positions/PositionDetailDrawer";

import {
  SLAErrorCard,
  SLACardHeader,
  SLALoadingCard,
  SLAWidgetContent,
} from "./SLAViolationsWidgetParts";
import { useSlaViolationsWidget } from "./use-sla-violations-widget";

interface SLAViolationsWidgetProps {
  recruiterId?: string;
  onDataUpdate?: () => void;
}

export function SLAViolationsWidget({ recruiterId, onDataUpdate }: SLAViolationsWidgetProps) {
  const widget = useSlaViolationsWidget({ recruiterId, onDataUpdate });

  if (widget.isLoading) {
    return <SLALoadingCard />;
  }

  if (widget.error) {
    return <SLAErrorCard onRetry={widget.fetchSLAData} />;
  }

  return (
    <>
      <Card className="h-full flex flex-col" style={{ height: "100%" }}>
        <SLACardHeader
          actualRecruiterId={widget.actualRecruiterId}
        />
        <CardContent className="flex-1 p-0" style={{ height: "calc(100% - 120px)" }}>
          <div className="h-full">
            {widget.statistics && (
              <SLAWidgetContent
                statistics={widget.statistics}
                filterSeverity={widget.filterSeverity}
                filteredPositions={widget.filteredPositions}
                hasHeadcounts={widget.hasHeadcounts}
                positionsWithoutSLA={widget.positionsWithoutSLA}
                onFilterSeverityChange={widget.setFilterSeverity}
                onOpenPosition={widget.openPosition}
                getCountsForPosition={widget.getCountsForPosition}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <PositionDetailDrawer
        isOpen={widget.isPositionDrawerOpen}
        onOpenChange={widget.setIsPositionDrawerOpen}
        positionId={widget.selectedPositionId}
      />
    </>
  );
}
