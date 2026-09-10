"use client";

import {
  Briefcase,
  CalendarIcon,
  CheckCircle2,
  Timer,
  UserRoundSearch,
  Users,
  XCircle,
} from "lucide-react";

import { getActiveApplicantStatusesQuery } from "@/lib/types";
import { DashboardStatCard } from "./DashboardStatCard";

interface DashboardStatsSectionsProps {
  activeApplicants: number;
  applicationsThisWeek: number;
  averageTimeToHire: number;
  hasSSEUpdated: boolean;
  highScoreApplicants: number;
  hiredThisMonth: number;
  isLoading: boolean;
  isPageRefresh: boolean;
  openHeadcounts: number;
  rejectedThisMonth: number;
  onNavigate: (href: string) => void;
}

function buildCurrentMonthRangeQuery(status: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return `status:${status} applicationDateStart:${monthStart.toISOString()} applicationDateEnd:${monthEnd.toISOString()}`;
}

function buildApplicationsThisWeekQuery() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return `applicationDateStart:${weekAgo.toISOString().slice(0, 10)}`;
}

export function DashboardStatsSections({
  activeApplicants,
  applicationsThisWeek,
  averageTimeToHire,
  hasSSEUpdated,
  highScoreApplicants,
  hiredThisMonth,
  isLoading,
  isPageRefresh,
  openHeadcounts,
  rejectedThisMonth,
  onNavigate,
}: DashboardStatsSectionsProps) {
  const featuredStats = [
    {
      title: "This Week's Applications",
      value: applicationsThisWeek,
      icon: CalendarIcon,
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "New Applicants this week",
      button: {
        label: "View All",
        onClick: () => onNavigate('/applicants?query=' + encodeURIComponent(buildApplicationsThisWeekQuery())),
      },
    },
    {
      title: "Hired This Month",
      value: hiredThisMonth,
      icon: CheckCircle2,
      color: "text-green-500 dark:text-green-400",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50",
      borderColor: "border-green-200 dark:border-green-800",
      description: "Successful placements",
      button: {
        label: "View All",
        onClick: () => onNavigate('/applicants?query=' + encodeURIComponent(buildCurrentMonthRangeQuery('Hired'))),
      },
    },
    {
      title: "Rejected This Month",
      value: rejectedThisMonth,
      icon: XCircle,
      color: "text-red-500 dark:text-red-400",
      bgColor: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50",
      borderColor: "border-red-200 dark:border-red-800",
      description: "Declined Applicants",
      button: {
        label: "View All",
        onClick: () => onNavigate('/applicants?query=' + encodeURIComponent(buildCurrentMonthRangeQuery('Rejected'))),
      },
    },
  ];

  const recruiterStats = [
    {
      title: "Active Applicants",
      value: activeApplicants,
      icon: Users,
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "On process Applicants",
      button: {
        label: "View All",
        onClick: () => onNavigate('/applicants?query=' + encodeURIComponent('status:' + getActiveApplicantStatusesQuery())),
      },
    },
    {
      title: "Number of Open Headcount",
      value: openHeadcounts,
      icon: Briefcase,
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      description: "Total number of open headcount",
      button: {
        label: "View All",
        onClick: () => onNavigate('/positions?status=Open&recruiterId=all'),
      },
    },
    {
      title: "High Score (80+)",
      value: highScoreApplicants,
      icon: UserRoundSearch,
      color: "text-yellow-500 dark:text-yellow-400",
      bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      description: "Need attention",
      button: {
        label: "View All",
        onClick: () => onNavigate('/applicants?query=' + encodeURIComponent('minAppliedJobFitScore:80')),
      },
    },
    {
      title: "Avg Time to Hire",
      value: averageTimeToHire,
      icon: Timer,
      color: "text-teal-500 dark:text-teal-400",
      bgColor: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/50",
      borderColor: "border-teal-200 dark:border-teal-800",
      description: "Days to hire",
    },
  ];

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-4">
          {featuredStats.map((stat, index) => (
            <DashboardStatCard
              key={stat.title}
              stat={stat}
              index={index}
              isLoading={isLoading}
              isPageRefresh={isPageRefresh}
              hasSSEUpdated={hasSSEUpdated}
              variant="featured"
              className={index === 0 ? 'sm:col-span-2 lg:col-span-2' : undefined}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-4">
          {recruiterStats.map((stat, index) => (
            <DashboardStatCard
              key={stat.title}
              stat={stat}
              index={index}
              isLoading={isLoading}
              isPageRefresh={isPageRefresh}
              hasSSEUpdated={hasSSEUpdated}
            />
          ))}
        </div>
      </div>
    </>
  );
}
