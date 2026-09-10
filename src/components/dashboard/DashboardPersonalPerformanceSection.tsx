"use client";

import {
  CalendarClock,
  UserRoundSearch,
  Users,
} from 'lucide-react';

import { getActiveApplicantStatusesQuery } from '@/lib/types';

import { DashboardStatCard } from './DashboardStatCard';

type NavigateHandler = (href: string) => void;

export function DashboardPersonalPerformanceSection({
  hasSSEUpdated,
  isLoading,
  isPageRefresh,
  myActiveApplicantsCount,
  myApplicantsInInterviewCount,
  newApplicantsAssignedTodayCount,
  onNavigate,
  recruiterId,
}: {
  hasSSEUpdated: boolean;
  isLoading: boolean;
  isPageRefresh: boolean;
  myActiveApplicantsCount: number;
  myApplicantsInInterviewCount: number;
  newApplicantsAssignedTodayCount: number;
  onNavigate: NavigateHandler;
  recruiterId?: string;
}) {
  const personalStats = getPersonalStats({
    myActiveApplicantsCount,
    myApplicantsInInterviewCount,
    newApplicantsAssignedTodayCount,
    onNavigate,
    recruiterId,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PersonalPerformanceHeader />

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {personalStats.map((stat, index) => (
          <DashboardStatCard
            key={stat.title}
            stat={stat}
            index={index}
            isLoading={isLoading}
            isPageRefresh={isPageRefresh}
            hasSSEUpdated={hasSSEUpdated}
            variant="personal"
            animationDelayMs={150}
          />
        ))}
      </div>
    </div>
  );
}

function PersonalPerformanceHeader() {
  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-lg font-semibold text-foreground">My performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Personal recruiting metrics.</p>
      </div>
      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">Personal</span>
    </div>
  );
}

function getPersonalStats({
  myActiveApplicantsCount,
  myApplicantsInInterviewCount,
  newApplicantsAssignedTodayCount,
  onNavigate,
  recruiterId,
}: {
  myActiveApplicantsCount: number;
  myApplicantsInInterviewCount: number;
  newApplicantsAssignedTodayCount: number;
  onNavigate: NavigateHandler;
  recruiterId?: string;
}) {
  return [
    {
      title: 'Active Applicants',
      value: myActiveApplicantsCount,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      description: 'In my pipeline',
      button: {
        label: 'View All',
        onClick: () => onNavigate(`/applicants?query=${encodeURIComponent(`recruiterId:${recruiterId} status:${getActiveApplicantStatusesQuery()}`)}`),
      },
    },
    {
      title: 'In Interview',
      value: myApplicantsInInterviewCount,
      icon: UserRoundSearch,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      description: 'Currently interviewing',
      button: {
        label: 'View All',
        onClick: () => onNavigate(`/applicants?query=${encodeURIComponent(`recruiterId:${recruiterId} status:Interview Scheduled,Interviewing`)}`),
      },
    },
    {
      title: 'New Today',
      value: newApplicantsAssignedTodayCount,
      icon: CalendarClock,
      color: 'text-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200',
      description: 'Assigned today',
      button: {
        label: 'View All',
        onClick: () => onNavigate(`/applicants?query=${encodeURIComponent(getTodayAssignedQuery(recruiterId))}`),
      },
    },
  ];
}

function getTodayAssignedQuery(recruiterId?: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return `recruiterId:${recruiterId} applicationDateStart:${todayStart.toISOString()} applicationDateEnd:${todayEnd.toISOString()}`;
}
