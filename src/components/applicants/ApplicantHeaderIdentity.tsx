import {
  ArrowsRightLeftIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Applicant } from "@/lib/types";
import { BlacklistBadge } from "./BlacklistBadge";

interface ApplicantIdentityBlockProps {
  applicant: Applicant;
  nameInfo: {
    fontClass: string;
    lang: string;
    name: string;
  };
  onManageTransitions?: () => void;
  reviewMode?: boolean;
}

export function ApplicantIdentityBlock({
  applicant,
  nameInfo,
  onManageTransitions,
  reviewMode = false,
}: ApplicantIdentityBlockProps) {
  const currentStage = applicant.recruitmentStage?.name || applicant.status || "Not provided";

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span
          className={`line-clamp-1 font-bold tracking-[-0.02em] text-foreground ${reviewMode ? "text-[22px] leading-7 text-[#101b34]" : "text-xl sm:text-2xl"} ${nameInfo.fontClass}`}
          lang={nameInfo.lang}
        >
          {nameInfo.name}
          {applicant.isPinned && (
            <Pin className="inline-block ml-2 h-4 w-4 text-amber-500 fill-current align-text-top" />
          )}
        </span>
        <div className="flex items-center gap-2">
          {onManageTransitions && (
            <button
              type="button"
              aria-label={`Change pipeline stage. Current stage: ${currentStage}`}
              onClick={onManageTransitions}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#d8e0ec] bg-[#f7f9fc] px-2.5 text-[11px] font-semibold text-[#42506a] transition-colors hover:border-[#b9c9e2] hover:bg-[#edf3fb] hover:text-[#0b63e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b63e6]/25"
            >
              <ArrowsRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Change stage
            </button>
          )}
          {applicant.isPinned && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1"
            >
              <Pin className="w-3 h-3 rotate-45 fill-current text-blue-600 dark:text-blue-400" />
              Pinned
            </Badge>
          )}
          {applicant.isBlacklisted && (
            <BlacklistBadge
              className="px-2 py-1 rounded-full flex items-center gap-1"
              iconClassName="w-3 h-3"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#536079]">
        {applicant.email && (
          <ContactItem icon={EnvelopeIcon}>
            {applicant.email}
          </ContactItem>
        )}
        {applicant.phone && (
          <ContactItem icon={PhoneIcon}>
            {applicant.phone}
          </ContactItem>
        )}
      </div>

      <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[12px] text-[#536079]">
        <BriefcaseIcon className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
        <span>Applied for</span>
        <span className="truncate font-semibold text-[#263451]">
          {applicant.position?.title || "Position not assigned"}
        </span>
      </div>

    </div>
  );
}

function ContactItem({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
      <span className="font-medium text-[#42506a]">{children}</span>
    </div>
  );
}
