import type {
  Applicant,
  ApplicantSource,
  UserProfile,
} from "@/lib/types";
import { ApplicantRecruiterCell } from "./ApplicantRecruiterCell";
import { ApplicantSourceCell } from "./ApplicantSourceCell";

interface ApplicantHeaderAssignmentsProps {
  applicant: Applicant;
  availableRecruiter: UserProfile[];
  availableSources: ApplicantSource[];
  isAssigningRecruiter: boolean;
  isAssigningSource: boolean;
  onAssignRecruiter: (recruiterId: string | null) => void;
  onAssignSource: (
    applicantId: string,
    sourceId: string | null,
    subSource?: string | null,
  ) => void;
  onResetAssigning: () => void;
  onResetSourceAssigning: () => void;
}

export function ApplicantHeaderAssignments({
  applicant,
  availableRecruiter,
  availableSources,
  isAssigningRecruiter,
  isAssigningSource,
  onAssignRecruiter,
  onAssignSource,
  onResetAssigning,
  onResetSourceAssigning,
}: ApplicantHeaderAssignmentsProps) {
  return (
    <>
      <div className="border border-border rounded-lg">
        <ApplicantSourceCell
          applicant={applicant}
          availableSources={availableSources}
          canManageApplicants={true}
          isAssigning={isAssigningSource}
          onAssignSource={onAssignSource}
          onResetAssigning={onResetSourceAssigning}
        />
      </div>
      <div className="border border-border rounded-lg">
        <ApplicantRecruiterCell
          applicant={applicant}
          availableRecruiter={availableRecruiter}
          canManageApplicants={true}
          isAssigning={isAssigningRecruiter}
          onAssignRecruiter={(_applicantId, recruiterId) =>
            onAssignRecruiter(recruiterId)
          }
          onResetAssigning={onResetAssigning}
        />
      </div>
    </>
  );
}
