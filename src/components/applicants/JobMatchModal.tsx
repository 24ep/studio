import { useCallback, useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hasAnyPermission } from '@/lib/permissions';
import { readJsonOrFallback } from '@/lib/response-json';
import type { ApplicantJobMatchModalData } from './full-applicant-detail-utils';
import {
  AccessDeniedJobMatchDialog,
  FitScoreCard,
  JobInformationCard,
  JobMatchModalHeader,
  JobMatchQuickActionsCard,
  MatchReasonsCard,
  PositionStatisticsCard,
} from './JobMatchModalParts';
import {
  buildApplicantsSearchUrl,
  buildJobMatchStatisticsUrl,
  DEFAULT_JOB_MATCH_STATS,
  formatJobMatchRequirements,
  sanitizeJobMatchStats,
  type JobMatchApplicantFilterType,
} from './job-match-modal-utils';

interface JobMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobMatch: ApplicantJobMatchModalData | null;
}

export default function JobMatchModal({ isOpen, onClose, jobMatch }: JobMatchModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingStats, setLoadingStats] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [stats, setStats] = useState(DEFAULT_JOB_MATCH_STATS);
  const routerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canViewJobMatches = hasAnyPermission(session?.user, ['JOB_MATCH_VIEW']);
  const canManageJobMatches = hasAnyPermission(session?.user, ['JOB_MATCH_MANAGE']);

  const fetchStatistics = useCallback(async () => {
    if (!jobMatch?.jobId) return;

    setLoadingStats(true);
    try {
      const response = await fetch(buildJobMatchStatisticsUrl(jobMatch.jobId));
      if (response.ok) {
        setStats(sanitizeJobMatchStats(await readJsonOrFallback<unknown>(response, {})));
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [jobMatch?.jobId]);

  useEffect(() => {
    if (isOpen && jobMatch?.jobId) {
      fetchStatistics();
    }
  }, [fetchStatistics, isOpen, jobMatch?.jobId]);

  useEffect(() => {
    return () => {
      if (routerTimeoutRef.current) {
        clearTimeout(routerTimeoutRef.current);
      }
    };
  }, []);

  const handleNavigateToApplicants = (filterType: JobMatchApplicantFilterType) => {
    if (!jobMatch?.jobId || isNavigating) return;

    setIsNavigating(true);
    const timeoutId = setTimeout(() => {
      router.replace(buildApplicantsSearchUrl(jobMatch.jobId, filterType));
      onClose();
    }, 100);

    if (routerTimeoutRef.current) {
      clearTimeout(routerTimeoutRef.current);
    }
    routerTimeoutRef.current = timeoutId;
  };

  if (!jobMatch) return null;

  if (!canViewJobMatches) {
    return <AccessDeniedJobMatchDialog isOpen={isOpen} onClose={onClose} />;
  }

  const positionRequirements = formatJobMatchRequirements(jobMatch.position?.requirements);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0" hideCloseButton>
        <JobMatchModalHeader jobMatch={jobMatch} onClose={onClose} />

        <div className="flex flex-col lg:flex-row gap-6 p-6 flex-1 min-h-0">
          <div className="lg:flex-1 space-y-6 overflow-y-auto pr-2">
            <JobInformationCard jobMatch={jobMatch} positionRequirements={positionRequirements} />
            <MatchReasonsCard matchReasons={jobMatch.matchReasons} />
          </div>

          <div className="lg:w-80 space-y-6">
            <FitScoreCard fitScore={jobMatch.fitScore} />
            <PositionStatisticsCard loading={loadingStats} stats={stats} />
            {canManageJobMatches && (
              <JobMatchQuickActionsCard
                isNavigating={isNavigating}
                onNavigate={handleNavigateToApplicants}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
