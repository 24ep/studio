"use client";

import { Bar } from "react-chartjs-2";
import { Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SCORE_COLOR_STOPS } from "@/components/ui/score-color";
import { useChartSetup } from "@/hooks/use-chart-setup";
import { cn } from "@/lib/utils";

type DashboardPipelineChartColorScheme = "stage" | "score";

interface DashboardPipelineChartCardProps {
  title: string;
  description: string;
  counts: Record<string, number>;
  isLoading: boolean;
  isPageRefresh: boolean;
  hasSSEUpdated: boolean;
  colorScheme?: DashboardPipelineChartColorScheme;
  tickFontSize?: number;
}

const STAGE_BAR_COLORS = [
  "rgba(147, 51, 234, 0.8)",
  "rgba(59, 130, 246, 0.8)",
  "rgba(34, 197, 94, 0.8)",
  "rgba(249, 115, 22, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(168, 85, 247, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(14, 165, 233, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(16, 185, 129, 0.8)",
];

const SCORE_BAR_COLORS = SCORE_COLOR_STOPS.map(stop =>
  stop.bg.replace("bg-", "rgba(").replace("-400", ", 0.8)"),
);

const getBarColors = (colorScheme: DashboardPipelineChartColorScheme) =>
  colorScheme === "score" ? SCORE_BAR_COLORS : STAGE_BAR_COLORS;

export function DashboardPipelineChartCard({
  title,
  description,
  counts,
  isLoading,
  isPageRefresh,
  hasSSEUpdated,
  colorScheme = "stage",
  tickFontSize = 12,
}: DashboardPipelineChartCardProps) {
  const { chartReady, error: chartError } = useChartSetup();

  return (
    <Card
      className={cn(
        "shadow-sm",
        isPageRefresh && !hasSSEUpdated && "animate-in slide-in-from-bottom-4",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-xs">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chartError ? (
            <div className="flex items-center justify-center">
              <div className="text-center space-y-3">
                <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-red-500 text-sm">Chart error: {chartError}</p>
                <Button onClick={() => window.location.reload()} className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          ) : !chartReady ? (
            <div className="flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                <p className="text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          ) : (
            <Bar
              data={{
                labels: Object.keys(counts),
                datasets: [
                  {
                    label: "Applicants",
                    data: Object.values(counts),
                    backgroundColor: getBarColors(colorScheme),
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    borderColor: "rgba(147, 51, 234, 0.3)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleColor: "white",
                    bodyColor: "white",
                    borderColor: "rgba(147, 51, 234, 0.3)",
                    borderWidth: 1,
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    grid: { color: "rgba(100,116,139,0.1)" },
                    ticks: { color: "rgb(100, 116, 139)", font: { size: tickFontSize } },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(100,116,139,0.1)" },
                    ticks: { color: "rgb(100, 116, 139)", font: { size: tickFontSize } },
                  },
                },
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
