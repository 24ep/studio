import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import type { Candidate, AutomationJobMatch, Position, CandidateDetails } from '@/lib/types';

interface RoleSuggestionSummaryProps {
  candidate: Candidate | null;
  allDbPositions: Position[];
}

const RoleSuggestionSummary: React.FC<RoleSuggestionSummaryProps> = ({ candidate, allDbPositions }) => {
  if (!candidate || !candidate.parsedData) {
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

  const jobMatches = (candidate.parsedData as CandidateDetails)?.job_matches;

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

  const currentAppliedPositionId = candidate.positionId;
  const currentAppliedPosition = allDbPositions.find(p => p.id === currentAppliedPositionId);
  const currentFitScore = candidate.fitScore || 0;
  let bestAlternativeMatch: AutomationJobMatch | null = null;
  let bestAlternativeScore = currentFitScore;
  let bestAlternativePositionInDb: Position | null = null;

  const openPositionsMap = new Map(allDbPositions.filter(p => p.isOpen).map(p => [p.title.toLowerCase(), p]));

  for (const jobMatch of jobMatches) {
    const jobMatchTitleLower = jobMatch.job_title?.toLowerCase();
    if (!jobMatchTitleLower) continue;
    const dbPositionMatch = openPositionsMap.get(jobMatchTitleLower);
    if (dbPositionMatch && dbPositionMatch.id !== currentAppliedPositionId) {
      if (jobMatch.fit_score > bestAlternativeScore && (jobMatch.fit_score - currentFitScore >= 10)) {
        bestAlternativeScore = jobMatch.fit_score;
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
              Consider {candidate.name} for the role of <strong>{bestAlternativeMatch.job_title}</strong> (Open Position).
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated Fit Score for this role: <span className="font-semibold text-foreground">{bestAlternativeMatch.fit_score}%</span>.
            </p>
            {currentAppliedPosition ? (
              <p className="text-xs text-muted-foreground">
                Currently applied for: &quot;{currentAppliedPosition.title}&quot; (Fit Score: {currentFitScore}%)
              </p>
            ) : (
               <p className="text-xs text-muted-foreground">Currently not formally applied to a specific position in our system (General Fit Score: {currentFitScore}%).</p>
            )}
            {bestAlternativeMatch.match_reasons && bestAlternativeMatch.match_reasons.length > 0 && (
              <div className="mt-1.5">
                <span className="font-semibold">Match Reasons:</span>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-0.5">
                  {bestAlternativeMatch.match_reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No better alternative match found for this candidate at this time.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSuggestionSummary; 