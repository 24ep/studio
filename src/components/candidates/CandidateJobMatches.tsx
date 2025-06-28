import React from 'react';
import type { AutomationJobMatch } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CandidateJobMatchesProps {
  jobMatches: AutomationJobMatch[];
}

const CandidateJobMatches: React.FC<CandidateJobMatchesProps> = ({ jobMatches }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {jobMatches && jobMatches.length > 0 ? (
          <ul>
            {jobMatches.map((match, idx) => (
              <li key={idx}>
                {match.job_title} (Fit Score: {match.fit_score}%)
              </li>
            ))}
          </ul>
        ) : (
          <div>No job matches found.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateJobMatches; 