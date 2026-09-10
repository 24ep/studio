"use client";

import type { RefObject } from "react";
import {
  ArrowRight,
  CalendarDays,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { PositionDetailDrawer } from "@/components/positions/PositionDetailDrawer";
import { ApplicantAvatarCompact } from "@/components/ui/applicant-avatar";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import type { Applicant } from "@/lib/types";
import { DashboardAdminPortalPanel, DashboardRoleWorkspace } from "./DashboardAdminPanels";
import type { DashboardHeadcountSummary } from "./DashboardHeadcountStatusCard";
import {
  DashboardChartsSection,
  DashboardPersonalActionItemsSection,
  DashboardPersonalPerformanceSection,
  DashboardPipelineAnalyticsSection,
} from "./DashboardPageSections";

type NavigateHandler = (href: string) => void;

interface DashboardMainContentProps {
  pageMode: "admin" | "hr";
  activeApplicants: number;
  applicationsThisWeek: number;
  averageTimeToHire: number;
  adminPositionsCount: number;
  adminUsersCount: number;
  canViewAllApplicants: boolean;
  isAdminPortal: boolean;
  filteredApplicants: Applicant[];
  hasSSEUpdated: boolean;
  headcountData: DashboardHeadcountSummary[];
  headcountLoading: boolean;
  highScoreApplicants: number;
  hiredThisMonth: number;
  isLoading: boolean;
  isPageRefresh: boolean;
  myActionItemsList: Applicant[];
  myActiveApplicantsCount: number;
  myApplicantsInInterviewCount: number;
  newApplicantsAssignedToMeTodayList: Applicant[];
  onDataUpdate: () => void;
  onNavigate: NavigateHandler;
  onPositionClick: (positionId: string) => void;
  onPositionDrawerOpenChange: (open: boolean) => void;
  onSelectedPositionIdChange: (positionId: string | null) => void;
  onProcessByRecruiter: Record<string, number>;
  onProcessByStage: Record<string, number>;
  openHeadcounts: number;
  positionDrawerOpen: boolean;
  recruiterId?: string;
  rejectedThisMonth: number;
  selectedPositionId: string | null;
  sharedHeight: number;
  sharedRef: RefObject<HTMLDivElement>;
  stageNames: Record<string, string>;
}

function formatMetric(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", options).format(value);
}

function buildCurrentMonthRangeQuery(status: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return `status:${status} applicationDateStart:${monthStart.toISOString()} applicationDateEnd:${monthEnd.toISOString()}`;
}

function getInterviewRows({
  filteredApplicants,
}: {
  filteredApplicants: Applicant[];
}) {
  return filteredApplicants.filter((applicant) => {
    const status = applicant.status || applicant.recruitmentStage?.name || "";
    return status.toLowerCase().includes("interview");
  }).slice(0, 3);
}

function DashboardMiniStat({
  description,
  label,
  onClick,
  unit = "total",
  value,
}: {
  description: string;
  label: string;
  onClick?: () => void;
  unit?: string;
  value: number | string;
}) {
  return (
    <div className="dashboard-mini-stat">
      <div>
        <p className="dashboard-mini-stat-label">{label}</p>
        <p className="dashboard-mini-stat-description">{description}</p>
      </div>
      <div className="dashboard-mini-stat-value">
        <span>{value}</span>
        <small>{unit}</small>
      </div>
      {onClick && (
        <button
          type="button"
          className="dashboard-view-link"
          onClick={onClick}
        >
          View all <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function DashboardInterviewPanel({
  filteredApplicants,
  interviewCount,
}: {
  filteredApplicants: Applicant[];
  interviewCount: number;
}) {
  const interviewRows = getInterviewRows({ filteredApplicants });
  const displayCount = Math.max(interviewCount, interviewRows.length);

  return (
    <aside className="dashboard-card dashboard-interview-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>Applicants in interview</h2>
          <p>People currently moving through interview stages.</p>
        </div>
        <span className="dashboard-interview-count">{displayCount}</span>
      </div>

      <div className="dashboard-interview-list">
        {interviewRows.length > 0 ? (
          interviewRows.map((applicant) => {
            const nameInfo = formatApplicantNameWithLang(applicant);

            return (
              <div className="dashboard-interview-item" key={applicant.id}>
                <ApplicantAvatarCompact
                  user={{
                    id: applicant.id,
                    name: nameInfo.name,
                    avatarUrl: applicant.avatarUrl,
                    email: applicant.email,
                  }}
                  size="md"
                  className="dashboard-interview-avatar"
                />
                <div className="dashboard-interview-copy">
                  <div className="dashboard-interview-topline">
                    <span className={nameInfo.fontClass} lang={nameInfo.lang}>
                      {nameInfo.name}
                    </span>
                    <strong>Interview stage</strong>
                  </div>
                  <p>{applicant.position?.title || "Open role"}</p>
                  <div className="dashboard-recruiter-line">
                    <ApplicantAvatarCompact
                      user={{
                        id: applicant.recruiter?.id || `${applicant.id}-recruiter`,
                        name: applicant.recruiter?.name || "Recruiter name",
                        email: applicant.recruiter?.email || applicant.email,
                      }}
                      size="sm"
                    />
                    <span>{applicant.recruiter?.name || "Recruiter name"}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="dashboard-interview-empty">
            <CalendarDays aria-hidden="true" />
            <p>No applicants are currently in an interview stage.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function DashboardMainContent({
  pageMode,
  activeApplicants,
  applicationsThisWeek,
  averageTimeToHire,
  adminPositionsCount,
  adminUsersCount,
  canViewAllApplicants,
  isAdminPortal,
  filteredApplicants,
  hasSSEUpdated,
  headcountData,
  headcountLoading,
  highScoreApplicants,
  hiredThisMonth,
  isLoading,
  isPageRefresh,
  myActionItemsList,
  myActiveApplicantsCount,
  myApplicantsInInterviewCount,
  newApplicantsAssignedToMeTodayList,
  onDataUpdate,
  onNavigate,
  onPositionClick,
  onPositionDrawerOpenChange,
  onSelectedPositionIdChange,
  onProcessByRecruiter,
  onProcessByStage,
  openHeadcounts,
  positionDrawerOpen,
  recruiterId,
  rejectedThisMonth,
  selectedPositionId,
  sharedHeight,
  sharedRef,
  stageNames,
}: DashboardMainContentProps) {
  void activeApplicants;
  void applicationsThisWeek;
  void averageTimeToHire;
  void adminPositionsCount;
  void adminUsersCount;
  void headcountData;
  void headcountLoading;
  void onPositionClick;
  void openHeadcounts;

  return (
    <div className={`dashboard-container dashboard-shell dashboard-shell--${pageMode}`}>
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-copy">
            <div className="dashboard-header-mark" aria-hidden="true">
              <Sparkles />
            </div>
            <div>
              <p className="dashboard-header-eyebrow">
                {pageMode === "hr" ? "Recruitment workspace" : "Hiring command center"}
              </p>
              <h1 className="dashboard-page-title">
                {pageMode === "hr" ? "HR Dashboard" : "Admin Portal"}
              </h1>
              <p className="dashboard-page-subtitle">
                {pageMode === "hr"
                  ? "Track hiring outcomes, interviews, recruiting trends, and pipeline movement."
                  : isAdminPortal
                    ? "Review recruiting activity, team workload, and workspace setup."
                    : "Track your applicants, priorities, and recruiting pipeline."}
              </p>
            </div>
          </div>
          <div className="dashboard-header-actions">
            <span
              className={`dashboard-status-chip ${hasSSEUpdated ? "is-live" : "is-ready"}`}
            >
              <span className="dashboard-status-dot" />
              {hasSSEUpdated ? "Live updates" : "Up to date"}
            </span>
            {pageMode === "hr" && (
              <button
                type="button"
                className="dashboard-filter-button"
                onClick={onDataUpdate}
                aria-label="Refresh dashboard data"
              >
                <RefreshCw aria-hidden="true" />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </header>

        {pageMode === "admin" && isAdminPortal ? (
          <DashboardAdminPortalPanel onNavigate={onNavigate} />
        ) : null}

        {pageMode === "admin" && !isAdminPortal && (
          <DashboardRoleWorkspace onNavigate={onNavigate} />
        )}

        {pageMode === "hr" && (
          <section
            className="dashboard-overview-grid"
            aria-label="Recruitment summary"
          >
            <div className="dashboard-card dashboard-activity-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Hiring outcomes</h2>
                  <p>A quick view of this month&apos;s movement.</p>
                </div>
              </div>
              <div className="dashboard-status-stack">
                <DashboardMiniStat
                  label="Hired this month"
                  description="Applicants who joined the team"
                  value={formatMetric(hiredThisMonth)}
                  onClick={() =>
                    onNavigate(
                      "/applicants?query=" +
                        encodeURIComponent(buildCurrentMonthRangeQuery("Hired")),
                    )
                  }
                />
                <DashboardMiniStat
                  label="Rejected this month"
                  description="Applications closed this month"
                  value={formatMetric(rejectedThisMonth)}
                  onClick={() =>
                    onNavigate(
                      "/applicants?query=" +
                        encodeURIComponent(buildCurrentMonthRangeQuery("Rejected")),
                    )
                  }
                />
                <DashboardMiniStat
                  label="High-fit applicants"
                  description="Applicants with an 80+ fit score"
                  value={formatMetric(highScoreApplicants)}
                  onClick={() =>
                    onNavigate(
                      "/applicants?query=" +
                        encodeURIComponent("minAppliedJobFitScore:80"),
                    )
                  }
                />
              </div>
            </div>

            <DashboardInterviewPanel
              filteredApplicants={filteredApplicants}
              interviewCount={myApplicantsInInterviewCount}
            />
          </section>
        )}

        <section className="dashboard-lower-grid" aria-label="Dashboard analytics">
          {pageMode === "hr" && (
            <section className="dashboard-analytics-section dashboard-full-panel">
              <DashboardChartsSection
                applicants={filteredApplicants}
                canViewAllApplicants={canViewAllApplicants}
                dynamicHeight={sharedHeight}
                isLoading={isLoading}
                onDataUpdate={onDataUpdate}
                recruiterId={recruiterId}
                sharedRef={sharedRef}
              />
            </section>
          )}

          {pageMode === "hr" && (
            <section className="dashboard-analytics-section dashboard-full-panel">
              <DashboardPipelineAnalyticsSection
                hasSSEUpdated={hasSSEUpdated}
                isLoading={isLoading}
                isPageRefresh={isPageRefresh}
                onProcessByRecruiter={onProcessByRecruiter}
                onProcessByStage={onProcessByStage}
              />
            </section>
          )}

          {pageMode === "admin" && !canViewAllApplicants && (
            <div className="dashboard-card dashboard-tall-panel">
              <DashboardPersonalPerformanceSection
                hasSSEUpdated={hasSSEUpdated}
                isLoading={isLoading}
                isPageRefresh={isPageRefresh}
                myActiveApplicantsCount={myActiveApplicantsCount}
                myApplicantsInInterviewCount={myApplicantsInInterviewCount}
                newApplicantsAssignedTodayCount={
                  newApplicantsAssignedToMeTodayList.length
                }
                onNavigate={onNavigate}
                recruiterId={recruiterId}
              />
            </div>
          )}

          {pageMode === "admin" && !canViewAllApplicants && (
            <div className="dashboard-card dashboard-full-panel">
              <DashboardPersonalActionItemsSection
                myActionItemsList={myActionItemsList}
                newApplicantsAssignedToMeTodayList={
                  newApplicantsAssignedToMeTodayList
                }
                recruiterId={recruiterId}
                stageNames={stageNames}
              />
            </div>
          )}
        </section>

        <PositionDetailDrawer
          isOpen={positionDrawerOpen}
          onOpenChange={(open) => {
            onPositionDrawerOpenChange(open);
            if (!open) {
              onSelectedPositionIdChange(null);
            }
          }}
          positionId={selectedPositionId}
        />
      </div>
    </div>
  );
}
