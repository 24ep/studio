"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { differenceInCalendarDays } from "date-fns";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { RecruiterAvatarCompact } from "@/components/ui/recruiter-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Applicant, RecruitmentStage } from "@/lib/types";
import { addApplicantComment } from "./applicant-comments-api";
import { ApplicantRecentActivity } from "./ApplicantRecentActivity";
import type { ApplicantAttachment } from "./applicant-attachment-utils";
import type { ApplicantCommentItem } from "./applicant-comments-utils";
import { ApplicantHiringBrief } from "./ApplicantHiringBrief";
import { SourceLogo } from "./ApplicantSourceCellPopover";
import { resolveFooterStages } from "./full-applicant-detail-footer-utils";

interface ApplicantReviewDecisionPanelProps {
  applicant: Applicant;
  availableStages: RecruitmentStage[];
  comments: ApplicantCommentItem[];
  isStatusUpdating: boolean;
  onRefresh: () => void;
  onStatusUpdate: (status: string, notes?: string) => Promise<boolean | undefined>;
  resumes: ApplicantAttachment[];
}

export function ApplicantReviewDecisionPanel({
  applicant,
  availableStages,
  comments,
  isStatusUpdating,
  onRefresh,
  onStatusUpdate,
  resumes,
}: ApplicantReviewDecisionPanelProps) {
  const [comment, setComment] = useState("");
  const [showHiringDetails, setShowHiringDetails] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const latestNote = comments.find(item => item.type === "remark" || item.type === "comment");
  const stageName = applicant.recruitmentStage?.name || applicant.status || "Not provided";
  const interviewDateLabel = getInterviewDateLabel(applicant);
  const appliedDate = applicant.applicationDate
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(applicant.applicationDate))
    : "Not provided";
  const appliedDateAge = applicant.applicationDate
    ? formatDayAge(new Date(applicant.applicationDate))
    : null;
  const actions = useMemo(() => resolveDecisionStages(availableStages), [availableStages]);
  const { nextStage } = useMemo(
    () => resolveFooterStages(applicant, availableStages),
    [applicant, availableStages],
  );

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSavingComment(true);
    try {
      await addApplicantComment({
        applicantId: applicant.id,
        content: comment.trim(),
        channel: "comment",
        files: [],
        labels: [],
      });
      setComment("");
      onRefresh();
      toast.success("Comment added");
    } catch {
      toast.error("Unable to add comment");
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white px-5 py-4 text-[#263451]">
      {showHiringDetails && (
        <div aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#68758e]">
            Hiring details
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[#68758e]">
            Offer considerations, ownership, documents, and consent records.
          </p>
        </div>
      )}

      <section className="border-b border-[#e2e7ef] pb-4">
        <button
          type="button"
          aria-controls="review-decision-hiring-details"
          aria-expanded={showHiringDetails}
          onClick={() => setShowHiringDetails(current => !current)}
          className="mt-4 flex w-full items-center justify-between border-t border-[#edf0f4] pt-3 text-left text-[12px] font-semibold text-[#0b63e6] transition-colors hover:text-[#084fae] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b63e6]/25"
        >
          <span>{showHiringDetails ? "Show less Hiring details" : "Show more Hiring details"}</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${showHiringDetails ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {showHiringDetails && (
          <div id="review-decision-hiring-details" className="-mx-5 mt-3 border-t border-[#e2e7ef]">
            <ApplicantHiringBrief
              applicant={applicant}
              resumes={resumes}
              showHeader={false}
              hiringOperationsSummary={(
                <dl className="space-y-3.5">
                  <DecisionFact
                    icon={ClockIcon}
                    label="Stage"
                    value={stageName}
                    secondary={/interview/i.test(stageName)
                      ? interviewDateLabel || "Interview date not scheduled"
                      : undefined}
                    accent
                  />
                  <DecisionFact
                    icon={UserCircleIcon}
                    label="Recruiter"
                    value={applicant.recruiter?.name || "Unassigned"}
                    valueNode={applicant.recruiter
                      ? <RecruiterProfilePopover recruiter={applicant.recruiter} />
                      : undefined}
                  />
                  <DecisionFact
                    icon={BriefcaseIcon}
                    label="Source"
                    value={applicant.source?.name || "Direct"}
                    visual={<SourceThumbnail source={applicant.source} />}
                  />
                  <DecisionFact
                    icon={CalendarDaysIcon}
                    label="Applied"
                    value={appliedDateAge ? `${appliedDate} (${appliedDateAge})` : appliedDate}
                  />
                </dl>
              )}
            />
          </div>
        )}
      </section>

      <section className="border-b border-[#e2e7ef] py-4">
        <h3 className="text-[14px] font-semibold text-[#12213d]">Hiring team note</h3>
        <p className="mt-2 text-[13px] leading-5 text-[#3d4c68]">
          {latestNote?.content || "No hiring note has been added yet."}
        </p>
        {latestNote?.author && (
          <p className="mt-2 text-xs text-slate-500">— {typeof latestNote.author === "string" ? latestNote.author : latestNote.author.name}</p>
        )}
      </section>

      <section className="border-b border-[#e2e7ef] py-4">
        <h3 className="text-[14px] font-semibold text-[#12213d]">Add a comment (@mention)</h3>
        <div className="relative mt-2.5">
          <Textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            onKeyDown={event => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submitComment();
            }}
            placeholder="Write a comment..."
            className="h-[46px] min-h-[46px] w-full resize-none overflow-hidden rounded-md border-[#d8dee8] bg-white py-3 pl-3 pr-12 text-[12px] text-[#263451] placeholder:text-[#9aa4b7] dark:bg-white dark:text-[#263451]"
          />
          <Button
            type="button"
            aria-label={savingComment ? "Sending comment" : "Send comment"}
            title={savingComment ? "Sending comment" : "Send comment"}
            disabled={!comment.trim() || savingComment}
            onClick={submitComment}
            className="absolute right-1.5 top-1.5 h-8 w-8 shrink-0 rounded bg-[#0b63e6] p-0 text-white shadow-none hover:bg-[#0957c9]"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <section className="space-y-2.5 border-b border-[#e2e7ef] py-4">
        <DecisionAction
          icon={ArrowRightIcon}
          label={nextStage ? `Next stage: ${nextStage.name}` : "No next stage"}
          className="!border-[#06afb1] !text-[#06a6a8] hover:!bg-[#effcfc]"
          stage={nextStage || undefined}
          isStatusUpdating={isStatusUpdating}
          onStatusUpdate={onStatusUpdate}
        />
        <DecisionAction
          icon={ClockIcon}
          label="Hold"
          className="!border-[#f5a000] !text-[#ec9800] hover:!bg-[#fff9eb]"
          stage={actions.hold}
          isStatusUpdating={isStatusUpdating}
          onStatusUpdate={onStatusUpdate}
        />
        <DecisionAction
          icon={NoSymbolIcon}
          label="Reject"
          confirmation="dialog"
          className="!border-[#ff5263] !text-[#f23f52] hover:!bg-[#fff3f5]"
          stage={actions.reject}
          isStatusUpdating={isStatusUpdating}
          onStatusUpdate={onStatusUpdate}
        />
      </section>

      <ApplicantRecentActivity applicant={applicant} />

    </div>
  );
}

function DecisionFact({
  icon: Icon,
  label,
  value,
  visual,
  valueNode,
  secondary,
  accent = false,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  visual?: React.ReactNode;
  valueNode?: React.ReactNode;
  secondary?: string;
  accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-[18px_82px_minmax(0,1fr)] items-center gap-2 text-[13px]">
      <Icon className="h-4 w-4 text-[#61708b]" aria-hidden="true" />
      <dt className="text-[#536079]">{label}</dt>
      <dd className="min-w-0 font-medium text-[#12213d]">
        <div className="flex min-w-0 items-center gap-2">
          {accent && <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-[#0b63e6]" aria-hidden="true" />}
          {visual}
          {valueNode || <span className="truncate">{value}</span>}
        </div>
        {secondary && (
          <p className="mt-0.5 truncate text-[11px] font-normal text-[#68758e]">
            {secondary}
          </p>
        )}
      </dd>
    </div>
  );
}

function RecruiterProfilePopover({ recruiter }: { recruiter: NonNullable<Applicant["recruiter"]> }) {
  const avatarUser = {
    id: recruiter.id,
    name: recruiter.name,
    avatarUrl: recruiter.avatarUrl,
    personalColor: recruiter.personalColor,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View ${recruiter.name} profile`}
          className="flex min-w-0 items-center gap-2 rounded text-left outline-none hover:text-[#0b63e6] focus-visible:ring-2 focus-visible:ring-[#0b63e6]/25"
        >
          <RecruiterAvatarCompact
            user={avatarUser}
            size="sm"
            showBorder={false}
            className="h-[28px] w-[28px]"
          />
          <span className="truncate">{recruiter.name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="flex items-center gap-3">
          <RecruiterAvatarCompact user={avatarUser} size="md" showBorder={false} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#12213d]">{recruiter.name}</p>
            <p className="text-xs text-[#68758e]">Recruiter</p>
          </div>
        </div>
        <div className="mt-3 border-t border-[#e2e7ef] pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#68758e]">Email</p>
          <a
            href={`mailto:${recruiter.email}`}
            className="mt-1 block truncate text-[13px] font-medium text-[#0b63e6] hover:underline"
          >
            {recruiter.email}
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SourceThumbnail({ source }: { source: Applicant["source"] }) {
  if (source?.logo) {
    return (
      <SourceLogo
        source={source}
        className="h-[28px] w-[28px] shrink-0 rounded-full border border-[#dfe5ee] bg-white object-contain p-1"
      />
    );
  }

  const initials = source?.name.trim().slice(0, 2).toUpperCase() || "DI";
  return (
    <span
      aria-hidden="true"
      className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full bg-[#edf2f8] text-[9px] font-bold text-[#526079]"
    >
      {initials}
    </span>
  );
}

function formatDayAge(date: Date) {
  const days = differenceInCalendarDays(new Date(), date);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days > 1) return `${days} days ago`;
  if (days === -1) return "in 1 day";
  return `in ${Math.abs(days)} days`;
}

function getInterviewDateLabel(applicant: Applicant) {
  const attributes = {
    ...(applicant.customFields || {}),
    ...(applicant.customAttributes || {}),
  } as Record<string, unknown>;
  const rawDate = attributes.interviewDateTime || attributes.interviewDate;
  if (typeof rawDate !== "string" && typeof rawDate !== "number") return null;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function DecisionAction({
  icon: Icon,
  label,
  confirmation = "popover",
  className,
  stage,
  isStatusUpdating,
  onStatusUpdate,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  confirmation?: "dialog" | "popover";
  className: string;
  stage?: RecruitmentStage;
  isStatusUpdating: boolean;
  onStatusUpdate: (status: string, notes?: string) => Promise<boolean | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (confirmation === "dialog") {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" disabled={!stage || isStatusUpdating} className={`h-[42px] w-full rounded-md bg-white text-[14px] font-semibold shadow-none outline-none focus-visible:ring-0 dark:bg-white ${className}`}>
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md border-slate-200 bg-white text-[#12213d]">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this applicant?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#536079]">
              This moves the applicant to {stage?.name || "Rejected"}. You can include a note explaining the decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder="Optional rejection note..."
            className="min-h-[96px] resize-none border-slate-200 bg-slate-50 text-[#263451] dark:bg-slate-50 dark:text-[#263451]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStatusUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!stage || isStatusUpdating}
              className="bg-[#e23d4f] text-white hover:bg-[#c92f40]"
              onClick={async event => {
                event.preventDefault();
                if (!stage) return;
                const result = await onStatusUpdate(stage.id, note);
                if (result) {
                  setOpen(false);
                  setNote("");
                }
              }}
            >
              {isStatusUpdating ? "Rejecting..." : "Reject applicant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={!stage || isStatusUpdating} className={`h-[42px] w-full rounded-md bg-white text-[14px] font-semibold shadow-none outline-none focus-visible:ring-0 dark:bg-white ${className}`}>
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="left" className="w-72 border-slate-200 bg-white text-slate-900">
        <h4 className="text-sm font-semibold">Confirm {label}</h4>
        <p className="mt-1 text-xs text-slate-500">Move this applicant to {stage?.name}.</p>
        <Textarea
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder="Optional note..."
          className="mt-3 min-h-[82px] resize-none bg-slate-50 text-slate-800 dark:bg-slate-50 dark:text-slate-800"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="button"
            size="sm"
            disabled={!stage || isStatusUpdating}
            onClick={async () => {
              if (!stage) return;
              const result = await onStatusUpdate(stage.id, note);
              if (result) {
                setOpen(false);
                setNote("");
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function resolveDecisionStages(stages: RecruitmentStage[]) {
  const find = (...terms: string[]) => stages.find(stage => terms.some(term => stage.name.toLowerCase().includes(term)));
  return {
    hold: find("hold", "pending"),
    reject: find("reject"),
  };
}
