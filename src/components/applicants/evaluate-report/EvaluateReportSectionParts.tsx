"use client";

import {
    ArrowPathIcon as Loader2,
    ArrowTopRightOnSquareIcon as ExternalLink,
    ExclamationCircleIcon as AlertCircle,
    PrinterIcon as Printer,
} from '@heroicons/react/24/outline';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sanitizeUrl } from '@/lib/utils';

export { EvaluateReportBody } from './EvaluateReportBody';

export function EvaluateReportLoadingState() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading evaluation data...</span>
            </div>
        </div>
    );
}

export function EvaluateReportMissingApplicantState() {
    return (
        <div className="flex items-center justify-center p-8">
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Applicant not found</AlertDescription>
            </Alert>
        </div>
    );
}

interface WaitingEvaluationsStateProps {
    completedCount: number;
    interviewerCount: number;
}

export function EvaluateReportWaitingState({
    completedCount,
    interviewerCount,
}: WaitingEvaluationsStateProps) {
    const progress = interviewerCount > 0 ? (completedCount / interviewerCount) * 100 : 0;

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Waiting for Evaluations</h3>
            <p className="text-muted-foreground mb-4">
                The evaluation report will be available once all interviewers complete their evaluations.
            </p>
            <div className="w-full max-w-xs bg-muted rounded-full h-3 overflow-hidden mb-2">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-sm text-muted-foreground">
                {completedCount} of {interviewerCount} interviewers completed
            </p>
        </div>
    );
}

interface EvaluateReportActionsProps {
    applicantId: string;
    onPrint: () => void;
}

export function EvaluateReportActions({
    applicantId,
    onPrint,
}: EvaluateReportActionsProps) {
    const openFullPage = () => {
        const url = `${window.location.origin}/applicants/${applicantId}/evaluate-result`;
        window.open(sanitizeUrl(url), '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-background border-b px-4 py-3 print:hidden flex justify-end">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrint}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={openFullPage}
                    className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                    <ExternalLink className="h-4 w-4" />
                    <span>Full Page</span>
                </Button>
            </div>
        </div>
    );
}
