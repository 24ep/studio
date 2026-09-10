"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";

import type {
  EvaluationAttachment,
  EvaluationAttachmentPreview,
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
  TestingResult,
} from "../types";
import { EvaluateHeader } from "./EvaluateHeader";
import {
  EvaluationWaitingMobileContent,
  EvaluationWaitingMobileOverlays,
} from "./EvaluationWaitingMobilePageParts";

export interface EvaluationWaitingMobilePageProps {
  evaluateHeaderStyle: React.CSSProperties;
  formData: EvaluationFormData;
  appLogoUrl: string | null;
  evaluateHeaderTextColor: string;
  onBack: () => void;
  attachments: EvaluationAttachment[];
  applicantId: string;
  onFileSelect: (file: EvaluationAttachmentPreview) => void;
  testingResults: TestingResult[];
  canEditScores: boolean;
  onTestingResultScoreChange: (index: number, score: number) => void;
  onTestingResultsBlur: () => void;
  testingResultsRef: React.MutableRefObject<TestingResult[]>;
  interviewers: Array<{ id: string; userId: string; userName: string; userEmail?: string; userRole?: string; avatarUrl?: string | null; positionTitle?: string }>;
  selectedInterviewerId: string | null;
  allEvaluations: Map<string, EvaluationSummary>;
  hasToken: boolean;
  evaluationLinkRequireLogin: boolean | null;
  status: string;
  applicantData: EvaluationFormData['applicant'] | null;
  interviewerSelectedBgColor: string;
  interviewerSelectedTextColor: string;
  interviewerSelectedBorderColor: string;
  interviewerSelectedBorderWidth: string;
  interviewerNonSelectedBgColor: string;
  interviewerNonSelectedTextColor: string;
  interviewerNonSelectedBorderColor: string;
  interviewerNonSelectedBorderWidth: string;
  onInterviewerSelect: (interviewerId: string, evaluation: EvaluationSummary | null) => void;
  existingEvaluation: EvaluationSummary | null;
  interviewerNameColor: string;
  onStartEvaluation: () => void;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  searchParams: Pick<URLSearchParams, "get">;
  onTraitClick: (traitId: string) => void;
  remarkSectionVisible: boolean;
  remarkText: string;
  savingRemark: boolean;
  remarkSaved: boolean;
  onRemarkChange: (text: string, event?: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onReportClick: () => void;
  onCloseRemark: () => void;
  evaluateHeaderBackgroundType: "image" | "gradient" | "solid";
  evaluateHeaderBackgroundImage: string | null;
  evaluateHeaderBackgroundGradient: string | null;
  evaluateHeaderBackgroundColor: string;
  fileViewerOpen: boolean;
  selectedFile: EvaluationAttachmentPreview | null;
  onFileViewerOpenChange: (open: boolean) => void;
  isMobile: boolean;
  reportDrawerOpen: boolean;
  onReportDrawerOpenChange: (open: boolean) => void;
  onOpenReportInNewPage: () => void;
}

export function EvaluationWaitingMobilePage(props: EvaluationWaitingMobilePageProps) {
  const {
    appLogoUrl,
    evaluateHeaderStyle,
    evaluateHeaderTextColor,
    formData,
    onBack,
  } = props;

  return (
    <div
      className="min-h-screen w-full h-screen px-0 flex flex-col"
      style={evaluateHeaderStyle}
    >
      <EvaluateHeader
        applicantName={formData.applicant.name}
        appLogoUrl={appLogoUrl}
        evaluateHeaderTextColor={evaluateHeaderTextColor}
        showBackButton={true}
        onBack={onBack}
      />

      <Card className="evaluate-card-rounded-top flex-1 border-0 shadow-lg">
        <CardContent className="h-full p-8 sm:p-12 pb-[20px] sm:pb-[20px] space-y-4 sm:space-y-8">
          <EvaluationWaitingMobileContent {...props} />
        </CardContent>
      </Card>

      <EvaluationWaitingMobileOverlays {...props} />
    </div>
  );
}
