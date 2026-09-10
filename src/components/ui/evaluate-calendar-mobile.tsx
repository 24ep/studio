"use client";

import * as React from 'react';

import type { EvaluateCalendarProps } from './evaluate-calendar-types';
import { MobileCalendarGrid } from './evaluate-calendar-mobile-grid';
import { MobileCalendarToolbar } from './evaluate-calendar-mobile-toolbar';
import { MobileEvaluationListView } from './evaluate-calendar-mobile-list';
import { SelectedDateItems } from './evaluate-calendar-mobile-selected-items';
import {
  getApplicantsForDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getRemindersForDate,
  groupEvaluationApplicantsByDate,
  sortEvaluationApplicantsByScheduleDate,
} from './evaluate-calendar-utils';

export function MobileEvaluateCalendar({
  applicants,
  selectedDate,
  onDateSelect,
  onApplicantClick,
  defaultView = 'list',
  reminders = [],
}: EvaluateCalendarProps & { defaultView?: 'list' | 'calendar' }) {
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>(defaultView);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const allApplicantsSorted = React.useMemo(
    () => sortEvaluationApplicantsByScheduleDate(applicants),
    [applicants]
  );
  const applicantsByDate = React.useMemo(
    () => groupEvaluationApplicantsByDate(allApplicantsSorted),
    [allApplicantsSorted]
  );

  if (viewMode === 'list') {
    return (
      <MobileEvaluationListView
        applicantsByDate={applicantsByDate}
        reminders={reminders}
        onApplicantClick={onApplicantClick}
        onCalendarView={() => setViewMode('calendar')}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MobileCalendarToolbar
        currentMonth={currentMonth}
        isCollapsed={isCollapsed}
        onListView={() => setViewMode('list')}
        onPreviousMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      />
      <MobileCalendarGrid
        applicants={applicants}
        reminders={reminders}
        monthDays={getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())}
        firstDay={getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())}
        selectedDate={selectedDate}
        isCollapsed={isCollapsed}
        onDateSelect={onDateSelect}
        onApplicantClick={onApplicantClick}
      />
      <SelectedDateItems
        selectedDate={selectedDate}
        applicants={getApplicantsForDate(applicants, selectedDate)}
        reminders={getRemindersForDate(reminders, selectedDate)}
        onApplicantClick={onApplicantClick}
      />
    </div>
  );
}
