"use client";

import { EvaluationErrorState, EvaluationLoadingState } from "./components/EvaluationPageStates";
import { ExpiredLinkPage } from "./components/ExpiredLinkPage";
import {
  EvaluationActiveFormPageView,
  EvaluationSelectionPageView,
} from "./EvaluationPageViewBranches";
import type { EvaluationPageViewProps } from "./evaluation-page-view-types";

export function EvaluationPageView(props: EvaluationPageViewProps) {
  const {
    applicantId,
    applicantData,
    formData,
    loading,
    error,
    linkExpired,
    canReactivateLink,
    appLogoUrl,
    sidebarBgColor,
    evaluateHeaderBackgroundType,
    evaluateHeaderBackgroundImage,
    evaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor,
    evaluateHeaderTextColor,
    showForm,
    positionId,
    onErrorBack,
    onBackToApplicants,
    onConfigureEvaluation,
  } = props;
  const pageBackgroundColor = sidebarBgColor || "hsl(var(--background))";

  if (linkExpired) {
    return (
      <ExpiredLinkPage
        applicantId={applicantId}
        applicantName={applicantData?.name || formData?.applicant?.name}
        appLogoUrl={appLogoUrl}
        canReactivate={canReactivateLink}
        evaluateHeaderBackgroundType={evaluateHeaderBackgroundType}
        evaluateHeaderBackgroundImage={evaluateHeaderBackgroundImage}
        evaluateHeaderBackgroundGradient={evaluateHeaderBackgroundGradient}
        evaluateHeaderBackgroundColor={evaluateHeaderBackgroundColor}
        evaluateHeaderTextColor={evaluateHeaderTextColor}
      />
    );
  }

  if (loading) {
    return <EvaluationLoadingState backgroundColor={pageBackgroundColor} />;
  }

  if (error || !formData) {
    return (
      <EvaluationErrorState
        backgroundColor={pageBackgroundColor}
        error={error}
        positionId={positionId}
        onBack={onErrorBack}
        onBackToApplicants={onBackToApplicants}
        onConfigureEvaluation={onConfigureEvaluation}
      />
    );
  }

  if (!showForm) {
    return <EvaluationSelectionPageView {...props} formData={formData} />;
  }

  return <EvaluationActiveFormPageView {...props} formData={formData} />;
}
