import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LightBulbIcon as Lightbulb } from '@heroicons/react/24/outline';
import type { Applicant, AutomationJobMatch, Position, ApplicantDetails } from '@/lib/types';
import { formatScoreWithGrade } from '@/lib/utils';
import { useJobMatchFeature } from '@/hooks/useJobMatchFeature';

interface RoleSuggestionSummaryProps {
  applicant: Applicant | null;
  allDbPositions: Position[];
}

const RoleSuggestionSummary: React.FC<RoleSuggestionSummaryProps> = ({ applicant, allDbPositions }) => {
  const { isJobMatchEnabled } = useJobMatchFeature();

  if (!isJobMatchEnabled) {
    return null;
  }

  if (!applicant || !applicant.parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No automated job match data to provide suggestions.</p>
        </CardContent>
      </Card>
    );
  }

  const jobMatches = (applicant.parsedData as ApplicantDetails)?.job_matches;

  if (!jobMatches || jobMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No automated job match data to provide suggestions.</p>
        </CardContent>
      </Card>
    );
  }

  const currentAppliedPositionId = applicant.positionId;
  const currentAppliedPosition = Array.isArray(allDbPositions) ? allDbPositions.find(p => p.id === currentAppliedPositionId) : null;
  const currentFitScore = applicant.fitScore || 0;
  let bestAlternativeMatch: AutomationJobMatch | null = null;
  let bestAlternativeScore = currentFitScore;
  let bestAlternativePositionInDb: Position | null = null;

  const openPositionsMap = new Map(allDbPositions.filter(p => p.isOpen).map(p => [p.title.toLowerCase(), p]));

  for (const jobMatch of jobMatches) {
    const jobMatchTitleLower = jobMatch.jobTitle?.toLowerCase();
    if (!jobMatchTitleLower) continue;
    const dbPositionMatch = openPositionsMap.get(jobMatchTitleLower);
    if (dbPositionMatch && dbPositionMatch.id !== currentAppliedPositionId) {
      if (jobMatch.fitScore > bestAlternativeScore && (jobMatch.fitScore - currentFitScore >= 0.1)) {
        bestAlternativeScore = jobMatch.fitScore;
        bestAlternativeMatch = jobMatch;
        bestAlternativePositionInDb = dbPositionMatch;
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Role Suggestion</CardTitle>
      </CardHeader>
      <CardContent>
        {bestAlternativeMatch && bestAlternativePositionInDb ? (
          <div className="p-3 border border-dashed border-primary/50 rounded-md bg-primary/5">
            <p className="text-sm text-foreground">
              Consider {applicant.name} for the role of <strong>{bestAlternativeMatch.jobTitle}</strong> (Open Headcount).
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated Fit Score for this role: <span className="font-semibold text-foreground">{formatScoreWithGrade(bestAlternativeMatch.fitScore)}</span>.
            </p>
            {currentAppliedPosition ? (
              <p className="text-xs text-muted-foreground">
                Currently applied for: &quot;{currentAppliedPosition.title}&quot; (Fit Score: {formatScoreWithGrade(currentFitScore)})
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Currently not formally applied to a specific position in our system (General Fit Score: {formatScoreWithGrade(currentFitScore)}).</p>
            )}
            {Array.isArray(bestAlternativeMatch.matchReasons) && bestAlternativeMatch.matchReasons.length > 0 && (
              <div className="mt-1.5">
                <span className="font-semibold">Match Reasons:</span>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-0.5">
                  {bestAlternativeMatch.matchReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No better alternative match found for this Applicant at this time.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSuggestionSummary; 