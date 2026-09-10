"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartSetup } from "@/hooks/use-chart-setup";
import type { Applicant } from "@/lib/types";

import { ApplicantScoreChartContent } from "./ApplicantScoreDistributionChartParts";
import { ApplicantScorePeriodControls } from "./ApplicantScorePeriodControls";
import {
  buildApplicantScoreChartData,
  buildApplicantScoreQuery,
  buildApplicantScoreRanges,
  createDefaultApplicantScoreDateRange,
  formatApplicantScorePeriodDisplay,
  getApplicantScorePeriodRange,
  sortApplicantScoreRanges,
  type ApplicantScorePeriodType,
  type ApplicantScorePeriodUnit,
  type ApplicantScoreRange,
} from "./applicant-score-distribution-utils";

interface ApplicantScoreDistributionChartProps {
  applicants: Applicant[];
  initialData?: { label: string; count: number }[];
  isLoading?: boolean;
  dynamicHeight?: number;
}

export function ApplicantScoreDistributionChart({
  applicants,
  initialData,
  isLoading = false,
  dynamicHeight,
}: ApplicantScoreDistributionChartProps) {
  const { chartReady, error: chartError } = useChartSetup();
  const router = useRouter();
  const [periodType, setPeriodType] = useState<ApplicantScorePeriodType>("lastN");
  const [periodUnit, setPeriodUnit] = useState<ApplicantScorePeriodUnit>("day");
  const [periodN, setPeriodN] = useState(7);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => createDefaultApplicantScoreDateRange());

  const periodRange = useMemo(() => getApplicantScorePeriodRange({
    periodType,
    periodUnit,
    periodN,
    dateRange,
  }), [periodType, periodUnit, periodN, dateRange]);

  const applicantScoreRanges = useMemo(() => buildApplicantScoreRanges({
    applicants,
    initialData,
    periodType,
    periodUnit,
    periodN,
    periodRange,
  }), [applicants, initialData, periodType, periodUnit, periodN, periodRange]);

  const sortedScoreRanges = useMemo(
    () => sortApplicantScoreRanges(applicantScoreRanges),
    [applicantScoreRanges],
  );

  const chartData = useMemo(
    () => buildApplicantScoreChartData(applicantScoreRanges),
    [applicantScoreRanges],
  );

  const periodDisplay = formatApplicantScorePeriodDisplay({
    periodType,
    periodUnit,
    periodN,
    dateRange,
  });

  const handleScoreBarClick = (range?: ApplicantScoreRange) => {
    if (!range) {
      return;
    }

    router.push(`/applicants?query=${encodeURIComponent(buildApplicantScoreQuery(range))}`);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 md:z-auto z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">
              Applicant Score Distribution
            </CardTitle>
          </div>

          <ApplicantScorePeriodControls
            dateRange={dateRange}
            periodN={periodN}
            periodType={periodType}
            periodUnit={periodUnit}
            onDateRangeChange={setDateRange}
            onPeriodNChange={setPeriodN}
            onPeriodTypeChange={setPeriodType}
            onPeriodUnitChange={setPeriodUnit}
          />
        </div>

        <CardDescription className="text-muted-foreground/70 text-xs">
          Distribution by fit score quality - {periodDisplay}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3">
        <ApplicantScoreChartContent
          chartData={chartData}
          chartError={chartError}
          chartReady={chartReady}
          dynamicHeight={dynamicHeight}
          isLoading={isLoading}
          onScoreBarClick={handleScoreBarClick}
          sortedScoreRanges={sortedScoreRanges}
        />
      </CardContent>
    </Card>
  );
}
