import { format } from "date-fns";
import parseISO from "date-fns/parseISO";

import type { Applicant } from "@/lib/types";

import { createInitialNewApplicationsDataset } from "./new-applications-chart-dataset";

export type InitialNewApplicationsDataPoint = {
  date: string;
  count: number;
};

export function countApplicationsInRange(applicants: Applicant[], startDate: Date, endDate: Date) {
  return applicants.filter(applicant => {
    if (!applicant.applicationDate) return false;

    try {
      const applicationDate = parseISO(applicant.applicationDate);
      return applicationDate >= startDate && applicationDate <= endDate;
    } catch {
      return false;
    }
  }).length;
}

export function buildInitialDataChartData(
  initialData: InitialNewApplicationsDataPoint[],
  startDate: Date,
  endDate: Date,
) {
  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
  const filtered = [...initialData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(dataPoint => {
      const dateTime = new Date(dataPoint.date).getTime();
      return dateTime >= startTime && dateTime <= endTime;
    });

  return {
    labels: filtered.map(dataPoint => format(new Date(dataPoint.date), "MMM dd")),
    datasets: [
      createInitialNewApplicationsDataset(filtered.map(dataPoint => dataPoint.count)),
    ],
  };
}
