import type { FullApplicantDetailController } from "./use-full-applicant-detail-controller";

export type LoadedFullApplicantDetailController = FullApplicantDetailController & {
  applicant: NonNullable<FullApplicantDetailController["applicant"]>;
};

export interface FullApplicantDetailSectionProps {
  controller: LoadedFullApplicantDetailController;
}
