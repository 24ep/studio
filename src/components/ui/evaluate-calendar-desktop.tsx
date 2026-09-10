"use client";

import * as React from "react";
import { toast } from "react-hot-toast";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DesktopCalendarGrid } from "./evaluate-calendar-desktop-grid";
import type { EvaluateCalendarProps, EvaluationApplicant } from "./evaluate-calendar-types";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
} from "./evaluate-calendar-utils";

type ViewMode = "month" | "week" | "agenda";
type ScheduleStatus = "confirmed" | "conflict" | "tentative";

interface PlannerEvent {
  applicantId: string;
  avatarUrl?: string | null;
  candidateName: string;
  dayIndex: number;
  durationMinutes: number;
  id: string;
  interviewers: string[];
  role: string;
  stage: string;
  startHour: number;
  status: ScheduleStatus;
}

interface UnscheduledCandidate {
  id: string;
  name: string;
  role: string;
  stage: string;
  avatarUrl?: string | null;
}

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const HOURS = Array.from({ length: 11 }, (_, index) => START_HOUR + index);

function startOfPlannerWeek(selectedDate: Date) {
  const date = new Date(selectedDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const offset = day === 0 ? 1 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

function formatHour(hour: number) {
  const wholeHour = Math.floor(hour);
  const minute = Math.round((hour - wholeHour) * 60);
  const displayHour = wholeHour > 12 ? wholeHour - 12 : wholeHour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${wholeHour >= 12 ? "PM" : "AM"}`;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function mapApplicantsToWeek(applicants: EvaluationApplicant[], weekStart: Date): PlannerEvent[] {
  const scheduled = applicants.flatMap((applicant) => {
    const interviewDateTime = applicant.evaluationLink.interviewDateTime;
    if (!interviewDateTime) return [];
    const date = new Date(interviewDateTime);
    if (Number.isNaN(date.getTime())) return [];
    const dayIndex = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - weekStart.getTime()) / 86_400_000);
    if (dayIndex < 0 || dayIndex > 4) return [];

    return [{
      applicantId: applicant.id,
      avatarUrl: applicant.avatarUrl,
      candidateName: applicant.name,
      dayIndex,
      durationMinutes: 60,
      id: `live-${applicant.id}`,
      interviewers: applicant.evaluationLink.interviewers?.map((person) => person.name).filter(Boolean) || [],
      role: applicant.position?.title || "Open position",
      stage: applicant.evaluationLink.interviewLocation
        ? `Interview · ${applicant.evaluationLink.interviewLocation}`
        : "Interview",
      startHour: date.getHours() + date.getMinutes() / 60,
      status: applicant.evaluationLink.interviewers?.length ? "confirmed" as const : "tentative" as const,
    }];
  });

  return scheduled.map((eventItem, index, allEvents) => {
    const hasConflict = allEvents.some((otherItem, otherIndex) => {
      if (index === otherIndex || eventItem.dayIndex !== otherItem.dayIndex) return false;
      const eventEnd = eventItem.startHour + eventItem.durationMinutes / 60;
      const otherEnd = otherItem.startHour + otherItem.durationMinutes / 60;
      const overlaps = eventItem.startHour < otherEnd && otherItem.startHour < eventEnd;
      return overlaps && eventItem.interviewers.some((person) => otherItem.interviewers.includes(person));
    });
    return hasConflict ? { ...eventItem, status: "conflict" as const } : eventItem;
  });
}

function getUnscheduledCandidates(applicants: EvaluationApplicant[]): UnscheduledCandidate[] {
  const now = Date.now();
  return applicants
    .filter((applicant) => {
      if (applicant.evaluationLink.interviewDateTime || applicant.evaluationLink.revokedAt) return false;
      const expiry = new Date(applicant.evaluationLink.expiresAt).getTime();
      return !Number.isNaN(expiry) && expiry > now;
    })
    .map((applicant) => ({
      avatarUrl: applicant.avatarUrl,
      id: applicant.id,
      name: applicant.name,
      role: applicant.position?.title || "Open position",
      stage: "Ready to schedule",
    }));
}

export function DesktopEvaluateCalendar({
  applicants,
  reminders = [],
  selectedDate,
  onDateSelect,
  onApplicantClick,
  onCreateLink,
  onScheduleApplicant,
}: EvaluateCalendarProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [interviewerFilter, setInterviewerFilter] = React.useState("all");
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [schedulingCandidateId, setSchedulingCandidateId] = React.useState<string | null>(null);
  const weekStart = React.useMemo(() => startOfPlannerWeek(selectedDate), [selectedDate]);
  const weekDays = React.useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const liveEvents = React.useMemo(() => mapApplicantsToWeek(applicants, weekStart), [applicants, weekStart]);
  const events = liveEvents;
  const unscheduled = React.useMemo(() => getUnscheduledCandidates(applicants), [applicants]);
  const interviewerOptions = React.useMemo(
    () => Array.from(new Set(events.flatMap((item) => item.interviewers))).sort(),
    [events]
  );
  const filteredEvents = interviewerFilter === "all"
    ? events
    : events.filter((item) => item.interviewers.includes(interviewerFilter));
  const conflictCount = events.filter((item) => item.status === "conflict").length;
  const tentativeCount = events.filter((item) => item.status === "tentative").length;

  const moveWeek = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    onDateSelect(next);
  };

  const scheduleCandidate = async (candidateId: string, dayIndex: number) => {
    const candidate = unscheduled.find((item) => item.id === candidateId);
    const date = weekDays[dayIndex];
    if (!candidate || !date || !onScheduleApplicant) return;
    const interviewDate = new Date(date);
    interviewDate.setHours(12, 0, 0, 0);
    try {
      setSchedulingCandidateId(candidateId);
      await onScheduleApplicant(candidateId, interviewDate.toISOString());
      toast.success(`${candidate.name} scheduled for ${date.toLocaleDateString("en-US", { weekday: "long" })} at 12:00 PM`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule interview");
    } finally {
      setSchedulingCandidateId(null);
    }
  };

  return (
    <div className="space-y-5" data-testid="interview-week-planner">
      <PlannerHeader
        conflictCount={conflictCount}
        eventsCount={events.length}
        interviewerFilter={interviewerFilter}
        interviewerOptions={interviewerOptions}
        onCreateLink={onCreateLink}
        onInterviewerFilterChange={setInterviewerFilter}
        onViewChange={setViewMode}
        tentativeCount={tentativeCount}
        viewMode={viewMode}
        weekDays={weekDays}
      />

      {viewMode === "week" && (
        <div className="grid min-h-[806px] grid-cols-[276px_minmax(880px,1fr)] gap-2 overflow-x-auto xl:grid-cols-[276px_minmax(0,1fr)]">
          <PlannerSidebar
            selectedDate={selectedDate}
            schedulingCandidateId={schedulingCandidateId}
            unscheduled={unscheduled}
            weekDays={weekDays}
            onDateSelect={onDateSelect}
          />
          <WeekTimeGrid
            events={filteredEvents}
            selectedEventId={selectedEventId}
            weekDays={weekDays}
            onApplicantClick={onApplicantClick}
            onDropCandidate={scheduleCandidate}
            onSelectEvent={setSelectedEventId}
          />
        </div>
      )}

      {viewMode === "month" && (
        <div className="h-[720px] overflow-hidden rounded-lg border bg-card">
          <DesktopCalendarGrid
            applicants={applicants}
            reminders={reminders}
            monthDays={getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth())}
            firstDay={getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth())}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            onApplicantClick={onApplicantClick}
          />
        </div>
      )}

      {viewMode === "agenda" && (
        <AgendaView events={filteredEvents} weekDays={weekDays} onApplicantClick={onApplicantClick} />
      )}

      <div className="sr-only">
        <button type="button" onClick={() => moveWeek(-7)}>Previous week</button>
        <button type="button" onClick={() => moveWeek(7)}>Next week</button>
      </div>
    </div>
  );
}

function PlannerHeader({
  conflictCount,
  eventsCount,
  interviewerFilter,
  interviewerOptions,
  onCreateLink,
  onInterviewerFilterChange,
  onViewChange,
  tentativeCount,
  viewMode,
  weekDays,
}: {
  conflictCount: number;
  eventsCount: number;
  interviewerFilter: string;
  interviewerOptions: string[];
  onCreateLink?: () => void;
  onInterviewerFilterChange: (value: string) => void;
  onViewChange: (mode: ViewMode) => void;
  tentativeCount: number;
  viewMode: ViewMode;
  weekDays: Date[];
}) {
  const first = weekDays[0];
  const last = weekDays[4];
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview Calendar</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Week of {first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} {"\u2013"} {last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span aria-hidden="true">·</span><span>{eventsCount} interviews</span>
          {conflictCount > 0 && <><span aria-hidden="true">·</span><span className="text-red-500">{conflictCount} conflict</span></>}
          {tentativeCount > 0 && <><span aria-hidden="true">·</span><span className="text-amber-500">{tentativeCount} tentative</span></>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border bg-card p-0.5" aria-label="Calendar view">
          {(["month", "week", "agenda"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => onViewChange(mode)} className={cn("rounded px-4 py-2 text-sm capitalize", viewMode === mode ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} aria-pressed={viewMode === mode}>{mode}</button>
          ))}
        </div>
        <label className="relative flex h-10 items-center rounded-md border bg-card pl-9 text-sm">
          <UserGroupIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <select aria-label="Filter by interviewer" value={interviewerFilter} onChange={(event) => onInterviewerFilterChange(event.target.value)} className="h-full appearance-none bg-transparent pl-1 pr-9 outline-none">
            <option value="all">All interviewers</option>
            {interviewerOptions.map((person) => <option key={person} value={person}>{person}</option>)}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
        </label>
        <Button onClick={onCreateLink} className="h-10 gap-2"><PlusIcon className="h-4 w-4" />Schedule interview</Button>
      </div>
    </div>
  );
}

function PlannerSidebar({ selectedDate, schedulingCandidateId, unscheduled, weekDays, onDateSelect }: { selectedDate: Date; schedulingCandidateId: string | null; unscheduled: UnscheduledCandidate[]; weekDays: Date[]; onDateSelect: (date: Date) => void }) {
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const moveMonth = (offset: number) => onDateSelect(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
  return (
    <aside className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1 text-muted-foreground"><button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} className="rounded p-1 hover:bg-muted"><ChevronLeftIcon className="h-4 w-4" /></button><button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="rounded p-1 hover:bg-muted"><ChevronRightIcon className="h-4 w-4" /></button></div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="text-muted-foreground">{day}</span>)}
          {days.map((date) => {
            const inMonth = date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
            const inWeek = weekDays.some((day) => day.toDateString() === date.toDateString());
            const isSelected = selectedDate.toDateString() === date.toDateString();
            return <button key={date.toISOString()} type="button" onClick={() => onDateSelect(date)} className={cn("mx-auto flex h-8 w-8 items-center justify-center rounded-md", !inMonth && "text-muted-foreground/50", inWeek && "bg-muted", isSelected && "rounded-full bg-primary text-primary-foreground")}>{date.getDate()}</button>;
          })}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2"><h3 className="font-semibold">Unscheduled</h3><span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{unscheduled.length}</span></div>
        <p className="mt-1 text-xs text-muted-foreground">Drag a candidate to schedule</p>
        <div className="mt-4 space-y-3">
          {unscheduled.map((candidate) => <UnscheduledRow key={candidate.id} candidate={candidate} isScheduling={schedulingCandidateId === candidate.id} />)}
          {unscheduled.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No applicants awaiting interview scheduling</p>}
        </div>
      </div>
    </aside>
  );
}

function UnscheduledRow({ candidate, isScheduling }: { candidate: UnscheduledCandidate; isScheduling: boolean }) {
  return (
    <div draggable={!isScheduling} onDragStart={(event) => event.dataTransfer.setData("text/candidate-id", candidate.id)} className={cn("flex items-center gap-3 rounded-md border bg-background p-3", isScheduling ? "cursor-wait opacity-60" : "cursor-grab active:cursor-grabbing")}>
      <PersonAvatar name={candidate.name} src={candidate.avatarUrl} className="h-9 w-9" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{candidate.name}</p><p className="truncate text-xs text-muted-foreground">{candidate.role}</p><p className="truncate text-xs text-muted-foreground">{candidate.stage}</p></div>
      <span className="text-lg leading-none text-muted-foreground" aria-hidden="true">⋮</span>
    </div>
  );
}

function WeekTimeGrid({ events, selectedEventId, weekDays, onApplicantClick, onDropCandidate, onSelectEvent }: { events: PlannerEvent[]; selectedEventId: string | null; weekDays: Date[]; onApplicantClick: EvaluateCalendarProps["onApplicantClick"]; onDropCandidate: (candidateId: string, dayIndex: number) => Promise<void>; onSelectEvent: (id: string) => void }) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-[78px_repeat(5,minmax(160px,1fr))] border-b">
        <div className="border-r" />
        {weekDays.map((date, index) => <button key={date.toISOString()} type="button" className={cn("border-r py-4 text-center text-sm font-semibold last:border-r-0", index === 0 && "border-b-2 border-b-primary")}><span>{date.toLocaleDateString("en-US", { weekday: "short" })}, </span><span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></button>)}
      </div>
      <div className="grid h-11 grid-cols-[78px_repeat(5,minmax(160px,1fr))] border-b text-xs text-muted-foreground">
        <div className="flex items-center justify-center border-r">All day</div>
        {weekDays.map((date) => <div key={`all-day-${date.toISOString()}`} className="border-r last:border-r-0" />)}
      </div>
      <div className="grid grid-cols-[78px_repeat(5,minmax(160px,1fr))]">
        <div className="relative border-r" style={{ height: `${HOUR_HEIGHT * 10}px` }}>
          {HOURS.slice(0, -1).map((hour, index) => <span key={hour} className="absolute right-3 -translate-y-1/2 text-xs text-muted-foreground" style={{ top: `${index * HOUR_HEIGHT}px` }}>{hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}</span>)}
        </div>
        {weekDays.map((date, dayIndex) => (
          <div key={date.toISOString()} className="relative border-r last:border-r-0" style={{ height: `${HOUR_HEIGHT * 10}px` }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDropCandidate(event.dataTransfer.getData("text/candidate-id"), dayIndex)}>
            {HOURS.slice(0, -1).map((hour, index) => <div key={hour} className="absolute inset-x-0 border-t border-border/60" style={{ top: `${index * HOUR_HEIGHT}px` }} />)}
            {events.filter((item) => item.dayIndex === dayIndex).map((item) => <PlannerEventCard key={item.id} event={item} selected={selectedEventId === item.id} onClick={() => {
              onSelectEvent(item.id);
              onApplicantClick(item.applicantId);
            }} />)}
          </div>
        ))}
      </div>
      {events.length === 0 && <div className="pointer-events-none absolute left-[78px] right-0 top-36 text-center"><p className="text-sm font-medium text-muted-foreground">No interviews scheduled for this week</p><p className="mt-1 text-xs text-muted-foreground/80">Schedule an interview or drag an applicant from the queue.</p></div>}
    </div>
  );
}

function PlannerEventCard({ event, selected, onClick }: { event: PlannerEvent; selected: boolean; onClick: () => void }) {
  const top = (event.startHour - START_HOUR) * HOUR_HEIGHT + 4;
  const height = Math.max(86, (event.durationMinutes / 60) * HOUR_HEIGHT - 8);
  const statusClass = event.status === "conflict" ? "border-red-500 bg-red-500/10" : event.status === "tentative" ? "border-dashed border-amber-500 bg-amber-500/10" : "border-primary/40 bg-primary/10";
  return (
    <button type="button" onClick={onClick} className={cn("absolute inset-x-1 z-10 overflow-hidden rounded-md border p-2 text-left transition-colors hover:bg-primary/15", statusClass, selected && "ring-2 ring-primary ring-offset-1 ring-offset-background")} style={{ top, height }}>
      <div className="flex items-start justify-between gap-1"><span className="text-[11px] text-muted-foreground">{formatHour(event.startHour)} – {formatHour(event.startHour + event.durationMinutes / 60)}</span>{event.status === "tentative" ? <ClockIcon className="h-4 w-4 text-amber-500" /> : <VideoCameraIcon className={cn("h-4 w-4", event.status === "conflict" ? "text-red-500" : "text-primary")} />}</div>
      <p className="truncate text-xs font-semibold">{event.candidateName}</p>
      <p className="truncate text-[11px] text-muted-foreground">{event.role}</p>
      {height > 66 && <p className="truncate text-[11px] text-muted-foreground">{event.stage}</p>}
      {height > 76 && event.interviewers.length > 0 && <div className="mt-1 flex -space-x-1">{event.interviewers.slice(0, 3).map((person, index) => <Avatar key={`${person}-${index}`} className="h-5 w-5 rounded-full border border-background"><AvatarFallback className="rounded-full text-[8px]">{initials(person)}</AvatarFallback></Avatar>)}</div>}
    </button>
  );
}

function AgendaView({ events, weekDays, onApplicantClick }: { events: PlannerEvent[]; weekDays: Date[]; onApplicantClick: EvaluateCalendarProps["onApplicantClick"] }) {
  const sorted = [...events].sort((a, b) => a.dayIndex - b.dayIndex || a.startHour - b.startHour);
  if (sorted.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border bg-card text-center">
        <p className="text-sm font-medium text-muted-foreground">No interviews scheduled for this week</p>
        <p className="mt-1 text-xs text-muted-foreground/80">Scheduled interviews will appear here.</p>
      </div>
    );
  }

  return <div className="overflow-hidden rounded-lg border bg-card">{sorted.map((item) => <button key={item.id} type="button" onClick={() => onApplicantClick(item.applicantId)} className="grid w-full grid-cols-[130px_1fr_180px] items-center gap-4 border-b p-4 text-left last:border-b-0 hover:bg-muted/30"><div><p className="text-sm font-medium">{weekDays[item.dayIndex]?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p><p className="text-xs text-muted-foreground">{formatHour(item.startHour)}</p></div><div className="flex items-center gap-3"><PersonAvatar name={item.candidateName} src={item.avatarUrl} className="h-9 w-9" /><div><p className="text-sm font-medium">{item.candidateName}</p><p className="text-xs text-muted-foreground">{item.role} · {item.stage}</p></div></div><span className={cn("text-xs capitalize", item.status === "conflict" ? "text-red-500" : item.status === "tentative" ? "text-amber-500" : "text-emerald-500")}>{item.status}</span></button>)}</div>;
}

function PersonAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return <Avatar className={cn("rounded-full", className)}><AvatarImage className="rounded-full" src={src || undefined} alt={name} /><AvatarFallback className="rounded-full">{initials(name)}</AvatarFallback></Avatar>;
}
