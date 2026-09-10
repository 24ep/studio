import type { DashboardStatCardVariant } from "./DashboardStatCard";

export function getStatValueSuffix(title: string, value: number, variant: DashboardStatCardVariant) {
  if (variant === "personal") {
    return "Applicants";
  }

  if (title === "Hired This Month" || (variant === "featured" && title === "Rejected This Month")) {
    return "this month";
  }

  if (title === "Avg Time to Hire") {
    return Math.abs(value - 1) < 0.01 ? "day" : "days";
  }

  return "total";
}

export function formatStatValue(title: string, value: number) {
  if (title === "Avg Time to Hire") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return value.toLocaleString();
}
