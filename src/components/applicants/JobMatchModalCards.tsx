import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BuildingOfficeIcon as Building,
  CurrencyDollarIcon as DollarSign,
  MapPinIcon as MapPin,
  UserGroupIcon as UserCheck,
  UsersIcon as Users,
  ArrowPathIcon as Loader2,
} from '@heroicons/react/24/outline';
import type { ApplicantJobMatchModalData } from './full-applicant-detail-utils';
import { displayFitScoreWithGrade, type JobMatchStats } from './job-match-modal-utils';

interface JobInformationCardProps {
  jobMatch: ApplicantJobMatchModalData;
  positionRequirements: string;
}

interface MatchReasonsCardProps {
  matchReasons: string[];
}

interface FitScoreCardProps {
  fitScore: number;
}

interface PositionStatisticsCardProps {
  loading: boolean;
  stats: JobMatchStats;
}

export function JobInformationCard({ jobMatch, positionRequirements }: JobInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Job Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <JobInfoField icon={MapPin} label="Location" value={jobMatch.position?.location || 'Not specified'} />
          <JobInfoField icon={DollarSign} label="Salary" value={jobMatch.position?.salary || 'Not specified'} />
        </div>

        {jobMatch.position?.description && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Description:</span>
            <p className="text-sm text-muted-foreground">
              {jobMatch.position.description}
            </p>
          </div>
        )}

        {positionRequirements && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Requirements:</span>
            <p className="text-sm text-muted-foreground">
              {positionRequirements}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MatchReasonsCard({ matchReasons }: MatchReasonsCardProps) {
  if (matchReasons.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Match Reasons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matchReasons.map((reason, index) => (
            <div key={`${reason}-${index}`} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{index + 1}</span>
              </div>
              <p className="text-sm text-foreground">{reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FitScoreCard({ fitScore }: FitScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Fit Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {displayFitScoreWithGrade(fitScore)}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on Applicant's skills and experience
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PositionStatisticsCard({ loading, stats }: PositionStatisticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Position Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <StatisticRow label="Total Applied" value={stats.totalApplied} />
            <StatisticRow label="Good Matches" value={stats.totalMatching} />
            <StatisticRow label="High Matches (Not Applied)" value={stats.matchingNotApplied} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JobInfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}:</span>
      </div>
      <p className="text-sm text-muted-foreground ml-6">{value}</p>
    </div>
  );
}

function StatisticRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}
