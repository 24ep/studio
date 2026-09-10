"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { EvaluationPageView } from './EvaluationPageView';
import { useApplicantEvaluationPageViewProps } from './use-applicant-evaluation-page-view-props';

function ApplicantEvaluationPageContent() {
  const viewProps = useApplicantEvaluationPageViewProps();

  return <EvaluationPageView {...viewProps} />;
}

function ApplicantEvaluationPageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ApplicantEvaluationPage() {
  return (
    <Suspense fallback={<ApplicantEvaluationPageFallback />}>
      <ApplicantEvaluationPageContent />
    </Suspense>
  );
}
