/**
 * Client-Safe SLA Utilities
 * 
 * These functions are safe to use in client components as they don't
 * import any server-only modules (like database connections).
 */

export interface SLACheckResult {
    isViolated: boolean;
    daysOverdue: number;
    slaDays: number;
    gradeName: string;
    gradeColor: string;
}

interface HeadcountSLAStartDateSource {
    status?: string | null;
    onboardingDate?: string | Date | null;
    requestDate?: string | Date | null;
}

/**
 * Get the appropriate badge variant based on days overdue
 * @param daysOverdue - Number of days the SLA is overdue
 * @returns Badge variant name
 */
export function getSLABadgeVariant(daysOverdue: number): 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' {
    if (daysOverdue === 0) return 'default';
    // Any overdue SLA should show as red (destructive)
    if (daysOverdue > 0) return 'destructive';
    return 'default';
}

/**
 * Format SLA message for display
 * @param slaResult - The SLA check result
 * @returns Formatted message string
 */
export function formatSLAMessage(slaResult: SLACheckResult): string {
    if (!slaResult.isViolated) {
        return `${slaResult.gradeName} - ${slaResult.slaDays} days SLA`;
    }

    return `${slaResult.gradeName} - ${slaResult.daysOverdue} days overdue (${slaResult.slaDays} days SLA)`;
}

/**
 * Get the effective SLA start date for a headcount (synchronous, no DB)
 * For filled headcounts, use the onboarding date
 * For vacant headcounts, use the request date
 * @param headcount - The headcount object
 * @returns The effective SLA start date or null
 */
export function getEffectiveSLAStartDateForHeadcount(headcount: HeadcountSLAStartDateSource): Date | null {
    // If headcount is filled and has onboarding date, use that
    if (headcount.status === 'filled' && headcount.onboardingDate) {
        return new Date(headcount.onboardingDate);
    }

    // Otherwise, use the request date
    if (headcount.requestDate) {
        return new Date(headcount.requestDate);
    }

    return null;
}
