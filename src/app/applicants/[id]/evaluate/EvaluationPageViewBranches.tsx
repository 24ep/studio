"use client";

import { EvaluationActiveFormBranch } from "./EvaluationActiveFormBranch";
import { EvaluationSelectionDesktopBranch } from "./EvaluationSelectionDesktopBranch";
import { EvaluationSelectionMobileBranch } from "./EvaluationSelectionMobileBranch";
import type { LoadedEvaluationPageViewProps } from "./evaluation-page-view-types";

export function EvaluationSelectionPageView(props: LoadedEvaluationPageViewProps) {
  return props.isDesktop
    ? <EvaluationSelectionDesktopBranch {...props} />
    : <EvaluationSelectionMobileBranch {...props} />;
}

export function EvaluationActiveFormPageView(props: LoadedEvaluationPageViewProps) {
  return <EvaluationActiveFormBranch {...props} />;
}
