import {
  ArrowTopRightOnSquareIcon as ExternalLink,
  ChevronDownIcon,
  ArrowPathIcon as RefreshCw,
  CalendarIcon as Calendar,
  CpuChipIcon as BrainCircuit,
  EllipsisVerticalIcon as MoreVertical,
  FlagIcon as Target,
  IdentificationIcon as Identification,
  PencilSquareIcon as Edit3,
  TrashIcon as Trash2,
  UsersIcon as Users,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Applicant, RecruitmentStage } from "@/lib/types";
import { ScreeningAction } from '@/components/screening/ScreeningAction';
import {
  ApplicantBlacklistMenuItem,
  ApplicantPinMenuItem,
  ApplicantReadMenuItem,
} from "./ApplicantHeaderActionItems";

interface ApplicantHeaderActionsProps {
  applicant: Applicant;
  availableStages: RecruitmentStage[];
  contentZIndex: number;
  isEditing: boolean;
  isCreatingEmployee?: boolean;
  onCreateEmployee?: () => void;
  onDelete: () => void;
  onEditClick: () => void;
  onEvaluate: () => void;
  onGenerativeAI: () => void;
  onManageTransitions: () => void;
  onReprocess: () => void;
  onSendInterviewInvitation?: () => void;
  onToggleBlacklist: () => void;
  onTogglePin?: () => void;
  onToggleRead?: () => void;
  reviewMode?: boolean;
}

export function ApplicantHeaderActions({
  applicant,
  availableStages,
  contentZIndex,
  isEditing,
  isCreatingEmployee = false,
  onCreateEmployee,
  onDelete,
  onEditClick,
  onEvaluate,
  onGenerativeAI,
  onManageTransitions,
  onReprocess,
  onSendInterviewInvitation,
  onToggleBlacklist,
  onTogglePin,
  onToggleRead,
  reviewMode = false,
}: ApplicantHeaderActionsProps) {
  const showCreateEmployee = Boolean(onCreateEmployee);
  const linkedEmployee = applicant.employee;
  const employeeHref = linkedEmployee ? `/people/${linkedEmployee.id}` : null;

  return (
    <div className="relative flex items-center gap-2" style={{ zIndex: contentZIndex + 2 }}>
      {!isEditing ? (
        <>
          {reviewMode && (
            <Button
              type="button"
              size="sm"
              onClick={onManageTransitions}
              className="h-[36px] min-w-[146px] rounded-md bg-[#0b63e6] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0756c9] dark:bg-[#0b63e6] dark:text-white"
              style={{ zIndex: contentZIndex + 3 }}
            >
              Advance stage
              <ChevronDownIcon className="ml-3 h-4 w-4" />
            </Button>
          )}
          {!reviewMode && employeeHref && linkedEmployee ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 rounded-[8px] px-3"
              style={{ zIndex: contentZIndex + 3 }}
            >
              <a
                href={employeeHref}
                aria-label={`Open employee ${linkedEmployee.employeeNumber}`}
              >
                <Identification className="mr-2 h-4 w-4" />
                {linkedEmployee.employeeNumber}
                <ExternalLink className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </Button>
          ) : !reviewMode && showCreateEmployee && (
            <Button
              type="button"
              size="sm"
              onClick={onCreateEmployee}
              disabled={isCreatingEmployee}
              className="h-8 rounded-[8px] bg-emerald-700 px-3 text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
              style={{ zIndex: contentZIndex + 3 }}
            >
              <Identification className="mr-2 h-4 w-4" />
              {isCreatingEmployee ? "Creating..." : "Create employee"}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={reviewMode ? "Actions" : undefined}
                className={reviewMode
                  ? "h-9 w-9 rounded-md border border-slate-200 bg-white p-0 text-[#12213d] hover:bg-slate-50 dark:bg-white dark:text-[#12213d]"
                  : "h-8 px-3 hover:bg-muted/50 transition-colors duration-200 pointer-events-auto flex items-center gap-2"}
                style={{ zIndex: contentZIndex + 3 }}
              >
                <MoreVertical className="h-4 w-4 flex-shrink-0 text-current" />
                {!reviewMode && <span className="whitespace-nowrap">Actions</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={`w-48 ${reviewMode ? "border-slate-200 bg-white text-slate-800 shadow-xl [&_[role=menuitem]]:text-slate-700 [&_[role=menuitem]]:focus:bg-slate-100 [&_[role=menuitem]]:focus:text-slate-900 [&_[role=separator]]:bg-slate-200" : ""}`}
              style={{ zIndex: contentZIndex + 4 }}
            >
              <DropdownMenuItem
                onClick={onEditClick}
                className="text-sm py-2 cursor-pointer"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Applicant Profile
              </DropdownMenuItem>
              {employeeHref && linkedEmployee ? (
                <DropdownMenuItem asChild className="text-sm py-2 cursor-pointer">
                  <a href={employeeHref}>
                    <Identification className="mr-2 h-4 w-4" />
                    Open employee {linkedEmployee.employeeNumber}
                  </a>
                </DropdownMenuItem>
              ) : showCreateEmployee && (
                <DropdownMenuItem
                  onClick={onCreateEmployee}
                  disabled={isCreatingEmployee}
                  className="text-sm py-2 cursor-pointer"
                >
                  <Identification className="mr-2 h-4 w-4" />
                  {isCreatingEmployee ? "Creating employee..." : "Create employee"}
                </DropdownMenuItem>
              )}
              {onTogglePin && (
                <ApplicantPinMenuItem applicant={applicant} onClick={onTogglePin} />
              )}
              {onToggleRead && (
                <ApplicantReadMenuItem applicant={applicant} onClick={onToggleRead} />
              )}
              <DropdownMenuItem
                onClick={onManageTransitions}
                disabled={availableStages.length === 0}
                className="text-sm py-2 cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Transitions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ScreeningAction subjectType="applicant" subjectId={applicant.id} />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onReprocess}
                className="text-sm py-2 cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-process
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onGenerativeAI}
                className="text-sm py-2 cursor-pointer"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                Generative AI
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onEvaluate}
                className="text-sm py-2 cursor-pointer"
              >
                <Target className="mr-2 h-4 w-4" />
                Create Interview Session
              </DropdownMenuItem>
              {onSendInterviewInvitation && (
                <DropdownMenuItem
                  onClick={onSendInterviewInvitation}
                  className="text-sm py-2 cursor-pointer"
                  disabled={!applicant.positionId}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Send Interviewer Invitation
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-sm py-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Applicant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ApplicantBlacklistMenuItem applicant={applicant} onClick={onToggleBlacklist} />
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <div className="flex gap-2" />
      )}
    </div>
  );
}
