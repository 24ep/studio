"use client";

import { FullApplicantDetailView } from "./FullApplicantDetailView";
import type { FullApplicantDetailProps } from "./FullApplicantDetailTypes";
import { useFullApplicantDetailController } from "./use-full-applicant-detail-controller";

export default function FullApplicantDetail(props: FullApplicantDetailProps) {
  const controller = useFullApplicantDetailController(props);

  return <FullApplicantDetailView controller={controller} />;
}
