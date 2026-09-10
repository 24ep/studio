import {
  ArrowPathIcon as RefreshCw,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  NoSymbolIcon as Ban,
} from "@heroicons/react/24/outline";
import { Pin } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Applicant } from "@/lib/types";

interface ApplicantHeaderActionItemProps {
  applicant: Applicant;
  onClick: () => void;
}

export function ApplicantPinMenuItem({ applicant, onClick }: ApplicantHeaderActionItemProps) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="text-sm py-2 cursor-pointer"
    >
      {applicant.isPinned ? (
        <>
          <Pin className="mr-2 h-4 w-4 text-blue-600 fill-current rotate-45" />
          Unpin from top
        </>
      ) : (
        <>
          <Pin className="mr-2 h-4 w-4 text-muted-foreground rotate-45" />
          Pin to top
        </>
      )}
    </DropdownMenuItem>
  );
}

export function ApplicantReadMenuItem({ applicant, onClick }: ApplicantHeaderActionItemProps) {
  return (
    <DropdownMenuItem onClick={onClick} className="text-sm py-2 cursor-pointer">
      {applicant.isRead === false ? (
        <>
          <EnvelopeOpenIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          Mark as Read
        </>
      ) : (
        <>
          <EnvelopeIcon className="mr-2 h-4 w-4 text-blue-600" />
          Mark as Unread
        </>
      )}
    </DropdownMenuItem>
  );
}

export function ApplicantBlacklistMenuItem({ applicant, onClick }: ApplicantHeaderActionItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`text-sm py-2 cursor-pointer ${applicant.isBlacklisted ? "text-muted-foreground" : "text-destructive focus:text-destructive"}`}
    >
      {applicant.isBlacklisted ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Remove from Blacklist
        </>
      ) : (
        <>
          <Ban className="mr-2 h-4 w-4" />
          Add to Blacklist
        </>
      )}
    </DropdownMenuItem>
  );
}
