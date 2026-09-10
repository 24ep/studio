"use client";

import { useEffect, useState } from "react";

import type { Applicant } from "@/lib/types";
import { fetchApplicantActivitiesPage } from "./applicant-comments-api";
import type { ApplicantActivityLogItem } from "./applicant-comments-utils";

interface RecentActivityEvent {
  actor: string;
  date: string;
  id: string;
  title: string;
}

export function ApplicantRecentActivity({ applicant }: { applicant: Applicant }) {
  const [logs, setLogs] = useState<ApplicantActivityLogItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchApplicantActivitiesPage({ applicantId: applicant.id, limit: 6, offset: 0 })
      .then(page => {
        if (!cancelled) setLogs(page?.logs || []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [applicant.id]);

  const events = buildRecentActivityEvents(applicant, logs);

  return (
    <section className="py-4" aria-labelledby="recent-activity-heading">
      <h3 id="recent-activity-heading" className="text-[14px] font-semibold normal-case text-[#12213d]">
        Recent activity
      </h3>
      <ol className="mt-3 space-y-0">
        {events.map((event, index) => (
          <li key={event.id} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-2.5 pb-3 last:pb-0">
            <div className="relative flex justify-center pt-1.5" aria-hidden="true">
              {index < events.length - 1 && (
                <span className="absolute bottom-[-2px] top-3 w-px bg-[#dfe4ec]" />
              )}
              <span className={`relative z-10 h-2 w-2 rounded-full ${index === 0 ? "bg-[#1769e8]" : "bg-[#b7c0ce]"}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-4 text-[#263451]">{event.title}</p>
              <p className="mt-0.5 text-[11px] leading-4 normal-case text-[#68758e]">
                {formatActivityTimestamp(event.date)} by {event.actor}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function buildRecentActivityEvents(
  applicant: Pick<Applicant, "applicationDate" | "id">,
  logs: ApplicantActivityLogItem[],
) {
  const events: RecentActivityEvent[] = (Array.isArray(logs) ? logs : [])
    .filter(log => Boolean(log.action && log.time))
    .map((log, index) => ({
      actor: log.user?.trim() || "System",
      date: log.time || "",
      id: log.id || `activity-${index}`,
      title: log.action?.trim() || "Applicant activity",
    }));

  const hasApplicationReceived = events.some(event =>
    event.title.toLowerCase().includes("application received"),
  );

  if (applicant.applicationDate && !hasApplicationReceived) {
    events.push({
      actor: "System",
      date: applicant.applicationDate,
      id: `application-${applicant.id}`,
      title: "Application received",
    });
  }

  return events
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 3);
}

export function formatActivityTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const datePart = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} at ${timePart}`;
}
