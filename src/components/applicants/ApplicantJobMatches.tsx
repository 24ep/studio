import React from 'react';
import type { AutomationJobMatch } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatScoreWithGrade } from '@/lib/utils';
import { useJobMatchFeature } from '@/hooks/useJobMatchFeature';

interface ApplicantJobMatchesProps {
  jobMatches: AutomationJobMatch[];
}

const ApplicantJobMatches: React.FC<ApplicantJobMatchesProps> = ({ jobMatches }) => {
  const { isJobMatchEnabled } = useJobMatchFeature();
  
  if (!isJobMatchEnabled) {
    return null;
  }
  
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
                {match.jobTitle} (Fit Score: {formatScoreWithGrade(match.fitScore)})
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

export default ApplicantJobMatches; 