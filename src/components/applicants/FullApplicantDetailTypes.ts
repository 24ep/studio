import type { Applicant } from "@/lib/types";
import type { ApplicantAttachment } from "./applicant-attachment-utils";
import type { ApplicantCommentItem } from "./applicant-comments-utils";

export interface FullApplicantDetailProps {
  applicantId: string;
  isModal?: boolean;
  onClose?: () => void;
  comments: ApplicantCommentItem[];
  resumes: ApplicantAttachment[];
  onRefresh: () => void;
  initialApplicant?: Applicant | null;
}
