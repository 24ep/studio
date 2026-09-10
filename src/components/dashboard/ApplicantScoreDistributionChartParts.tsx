"use client";

import { Bar } from "react-chartjs-2";
import { Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isDataLabelsAvailable } from "@/lib/chartjs-setup";

import {
  buildApplicantScoreChartData,
  type ApplicantScoreRange,
} from "./applicant-score-distribution-utils";

interface ApplicantScoreChartContentProps {
  chartData: ReturnType<typeof buildApplicantScoreChartData>;
  chartError: string | null;
  chartReady: boolean;
  dynamicHeight?: number;
  isLoading: boolean;
  onScoreBarClick: (range?: ApplicantScoreRange) => void;
  sortedScoreRanges: ApplicantScoreRange[];
}

export function ApplicantScoreChartContent({
  chartData,
  chartError,
  chartReady,
  dynamicHeight,
  isLoading,
  onScoreBarClick,
  sortedScoreRanges,
}: ApplicantScoreChartContentProps) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: dynamicHeight && dynamicHeight > 0 ? `${dynamicHeight}px` : "200px" }}
    >
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : chartError ? (
        <ApplicantScoreChartError error={chartError} />
      ) : !chartReady ? (
        <ApplicantScoreChartLoading />
      ) : (
        <Bar
          data={chartData}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => ` ${context.parsed.x} applicants`,
                },
              },
              ...(isDataLabelsAvailable() ? {
                datalabels: {
                  anchor: "end",
                  align: "end",
                  color: "#22223b",
                  font: { weight: "bold", size: 14 },
                  formatter: (value) => value,
                },
              } : {}),
            },
            onClick: (_event, elements) => {
              if (elements.length > 0) {
                onScoreBarClick(sortedScoreRanges[elements[0].index]);
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: "rgba(100,116,139,0.1)" },
                ticks: { color: "#64748b", font: { size: 13 } },
              },
              y: {
                grid: { display: false },
                ticks: { color: "#64748b", font: { size: 11 } },
              },
            },
          }}
        />
      )}
    </div>
  );
}

function ApplicantScoreChartError({ error }: { error: string }) {
  return (
    <div className="space-y-3 text-center">
      <XCircle className="mx-auto h-8 w-8 text-red-500" />
      <p className="text-sm text-red-500">Chart error: {error}</p>
      <Button onClick={() => window.location.reload()} className="mt-2">
        Retry
      </Button>
    </div>
  );
}

function ApplicantScoreChartLoading() {
  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      <p className="text-muted-foreground">Loading chart...</p>
    </div>
  );
}
