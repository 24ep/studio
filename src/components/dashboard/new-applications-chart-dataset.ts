import type { ScriptableContext } from "chart.js";

export function createNewApplicationsDataset(data: number[]) {
  return {
    label: "Current",
    data,
    borderColor: "rgba(59, 130, 246, 1)",
    backgroundColor: (context: ScriptableContext<"line">) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      if (!chartArea) {
        return "rgba(59, 130, 246, 0.4)";
      }

      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
      gradient.addColorStop(0.3, "rgba(59, 130, 246, 0.6)");
      gradient.addColorStop(0.7, "rgba(59, 130, 246, 0.8)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.9)");
      return gradient;
    },
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    pointBackgroundColor: "rgba(59, 130, 246, 1)",
    pointBorderColor: "#ffffff",
    pointBorderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 8,
    pointHoverBackgroundColor: "rgba(59, 130, 246, 1)",
    pointHoverBorderColor: "#ffffff",
    pointHoverBorderWidth: 3,
  };
}

export function createInitialNewApplicationsDataset(data: number[]) {
  return {
    label: "New Applications",
    data,
    fill: true,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgb(59, 130, 246)",
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: "rgb(59, 130, 246)",
    pointBorderColor: "#fff",
    pointBorderWidth: 2,
    pointHoverRadius: 6,
  };
}
