"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon as ChevronLeft,
  EllipsisVerticalIcon as MoreVertical,
  NoSymbolIcon as Ban,
} from "@heroicons/react/24/outline";
import { Pin } from "lucide-react";

import ApplicantCommentsSection from "./ApplicantCommentsSection";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { JobAppliedTab } from "./tabs/JobAppliedTab";
import type { Applicant, Position } from "@/lib/types";
import type { ApplicantAttachment, ApplicantFilePreview } from "./applicant-attachment-utils";
import type { ApplicantCommentItem } from "./applicant-comments-utils";
import { MobileApplicantInfoContent } from "./MobileApplicantInfoContent";
import type { MobileApplicantDetailTab } from "./MobileApplicantTabsNav";
import type { JobAppliedNamedEntity } from "./tabs/job-applied-tab-utils";

export function MobileApplicantHeader({
  applicant,
  nameInfo,
  isScrolled,
  onClose,
}: {
  applicant: Applicant;
  nameInfo: { fontClass: string; lang: string };
  isScrolled: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={cn(
      "flex-shrink-0 border-b sticky top-0 z-10 transition-all duration-300",
      isScrolled
        ? "bg-background/80 backdrop-blur-md shadow-sm"
        : "bg-background/95 backdrop-blur-sm"
    )}>
      <div className="flex items-center gap-2 p-3">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to applicants"
            onClick={onClose}
            className="h-9 w-9 flex-shrink-0 touch-manipulation border-none shadow-none hover:bg-transparent"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={cn("text-base font-bold truncate", nameInfo.fontClass, applicant.isBlacklisted && "text-destructive")} lang={nameInfo.lang}>
              {applicant.name}
            </h2>
            {applicant.isBlacklisted && <Ban className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
            {applicant.isPinned && (
              <Pin className="h-3.5 w-3.5 text-primary fill-current flex-shrink-0" />
            )}
          </div>
          {applicant.email && (
            <p className="text-xs text-muted-foreground truncate">{applicant.email}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileApplicantTabsContent({
  activeTab,
  applicant,
  applicantId,
  allDbPositions,
  availableStages,
  availableRecruiters,
  availableSources,
  attachments,
  comments,
  education,
  experience,
  appliedJobId,
  appliedFitScore,
  appliedJustification,
  onOpenPositionDrawer,
  onRefresh,
  onFileSelect,
}: {
  activeTab: MobileApplicantDetailTab;
  applicant: Applicant;
  applicantId: string;
  allDbPositions: Position[];
  availableStages: JobAppliedNamedEntity[];
  availableRecruiters: JobAppliedNamedEntity[];
  availableSources: JobAppliedNamedEntity[];
  attachments: ApplicantAttachment[];
  comments: ApplicantCommentItem[];
  education: unknown[];
  experience: unknown[];
  appliedJobId: string | null;
  appliedFitScore: number | null;
  appliedJustification: string[];
  onOpenPositionDrawer: (positionId: string) => void;
  onRefresh: () => void;
  onFileSelect: (file: ApplicantFilePreview) => void;
}) {
  const appliedJobBadge = appliedFitScore !== null ? (
    <Badge variant="secondary">{appliedFitScore}%</Badge>
  ) : null;

  if (activeTab === "job-applied") {
    return (
      <div className="h-full w-full overflow-y-auto p-4">
        <JobAppliedTab
          applicant={applicant}
          allDbPositions={allDbPositions}
          isEditing={false}
          onCopyJobApplied={() => {}}
          copiedJobApplied={false}
          appliedJobId={appliedJobId}
          appliedFitScore={appliedFitScore}
          appliedJustification={appliedJustification}
          appliedJobBadge={appliedJobBadge}
          onOpenPositionDrawer={onOpenPositionDrawer}
          availableStages={availableStages}
          availableRecruiters={availableRecruiters}
          availableSources={availableSources}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  if (activeTab === "applicant-info") {
    return (
      <div className="h-full w-full overflow-y-auto p-4">
        <MobileApplicantInfoContent
          applicant={applicant}
          applicantId={applicantId}
          attachments={attachments}
          education={education}
          experience={experience}
          onFileSelect={onFileSelect}
        />
      </div>
    );
  }

  if (activeTab === "attachments") {
    return (
      <div className="h-full w-full overflow-y-auto">
        <AttachmentsTab
          applicantId={applicantId}
          attachments={attachments}
          onRefresh={onRefresh}
          canUpload
          canDelete
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <ApplicantCommentsSection
        applicantId={applicantId}
        comments={comments}
        isEditing={false}
        onCommentsChange={onRefresh}
      />
    </div>
  );
}

export function MobileApplicantFloatingActionsButton({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <Button
        size="lg"
        onClick={onOpen}
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
        aria-label="Actions"
      >
        <MoreVertical className="h-7 w-7" />
      </Button>
    </div>
  );
}
