"use client";

import React from 'react';

import { PrintStyles } from './components/PrintStyles';
import {
    EvaluateReportActions,
    EvaluateReportBody,
    EvaluateReportLoadingState,
    EvaluateReportMissingApplicantState,
    EvaluateReportWaitingState,
} from './EvaluateReportSectionParts';
import { useEvaluateReportSection } from './use-evaluate-report-section';

interface EvaluateReportSectionProps {
    applicantId: string;
    isEmbedded?: boolean;
}

export function EvaluateReportSection({ applicantId, isEmbedded = false }: EvaluateReportSectionProps) {
    const report = useEvaluateReportSection(applicantId);

    if (report.loading) {
        return <EvaluateReportLoadingState />;
    }

    if (!report.applicant) {
        return <EvaluateReportMissingApplicantState />;
    }

    if (!report.allEvaluationsComplete && report.interviewers.length > 0) {
        return (
            <EvaluateReportWaitingState
                completedCount={report.completedCount}
                interviewerCount={report.interviewers.length}
            />
        );
    }

    return (
        <>
            <PrintStyles isInIframe={false} />
            <div className="bg-background h-full overflow-y-auto">
                {!isEmbedded && (
                    <EvaluateReportActions
                        applicantId={applicantId}
                        onPrint={report.handlePrint}
                    />
                )}

                <EvaluateReportBody
                    allEvaluations={report.allEvaluations}
                    appLogoUrl={report.appLogoUrl}
                    applicant={report.applicant}
                    averagedEvaluationData={report.averagedEvaluationData}
                    avatarInputRef={report.avatarInputRef}
                    avatarUploading={report.avatarUploading}
                    canEditApplicantBasic={report.canEditApplicantBasic}
                    chartReady={report.chartReady}
                    expandedGroups={report.expandedGroups}
                    expertiseGroups={report.expertiseGroups}
                    handleAvatarUpload={report.handleAvatarUpload}
                    isEmbedded={isEmbedded}
                    organizationAddress={report.organizationAddress}
                    organizationContact={report.organizationContact}
                    organizationLogoUrl={report.organizationLogoUrl}
                    organizationName={report.organizationName}
                    personalityGroups={report.personalityGroups}
                    position={report.position}
                    toggleGroup={report.toggleGroup}
                />
            </div>
        </>
    );
}
