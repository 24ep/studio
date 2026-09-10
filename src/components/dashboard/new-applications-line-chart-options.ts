import { Chart } from "chart.js";
import type { ChartOptions, LegendItem } from "chart.js";

import { isDataLabelsAvailable } from "@/lib/chartjs-setup";
import type { buildNewApplicationsChartData } from "./new-applications-time-series-utils";

type NewApplicationsChartData = ReturnType<typeof buildNewApplicationsChartData>;

type StyledLegendItem = LegendItem & {
  borderWidth?: number;
  borderColor?: string;
};

function getNewApplicationsYAxisTick(value: string | number, chartData: NewApplicationsChartData) {
  const maxValue = Math.max(...chartData.datasets.flatMap(dataset => dataset.data));

  if (maxValue <= 20) {
    return value;
  }

  if (maxValue <= 100) {
    return Number(value) % 5 === 0 ? value : "";
  }

  if (maxValue <= 500) {
    return Number(value) % 10 === 0 ? value : "";
  }

  return Number(value) % Math.ceil(maxValue / 50) === 0 ? value : "";
}

function getSuggestedYAxisMax(chartData: NewApplicationsChartData) {
  const maxValue = Math.max(...chartData.datasets.flatMap(dataset => dataset.data));
  return Math.ceil(maxValue * 1.2);
}

export function buildNewApplicationsLineChartOptions(
  chartData: NewApplicationsChartData,
): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "rgb(100, 116, 139)",
          font: { size: 10 },
          usePointStyle: true,
          padding: 15,
          pointStyle: "circle",
          generateLabels: function(chart) {
            const original = Chart.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);

            labels.forEach((label: StyledLegendItem) => {
              label.borderWidth = 0;
              label.borderColor = "transparent";
            });

            return labels;
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: ${context.parsed.y} applications`;
          },
        },
      },
      ...(isDataLabelsAvailable() ? {
        datalabels: {
          display: true,
          color: "#1f2937",
          font: {
            weight: "bold",
            size: 10,
          },
          formatter: function(value: number) {
            return typeof value === "number" && value !== 0 ? value : "";
          },
          anchor: "end",
          align: "top",
          offset: 8,
          clamp: true,
          clip: false,
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 0,
          padding: 0,
        },
      } : {}),
    },
    scales: {
      x: {
        grid: {
          color: "rgba(100,116,139,0.1)",
          display: false,
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 },
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(100,116,139,0.1)",
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 },
          callback: function(value: string | number) {
            return getNewApplicationsYAxisTick(value, chartData);
          },
        },
        suggestedMax: getSuggestedYAxisMax(chartData),
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
      line: {
        tension: 0.4,
      },
    },
  };
}
