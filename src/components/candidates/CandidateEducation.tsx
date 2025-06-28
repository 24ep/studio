import React from 'react';
import type { EducationEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CandidateEducationProps {
  education: EducationEntry[];
  // Add any handlers or state needed for editing, saving, etc.
}

const CandidateEducation: React.FC<CandidateEducationProps> = ({ education }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Education History</CardTitle>
      </CardHeader>
      <CardContent>
        {education && education.length > 0 ? (
          <ul>
            {education.map((entry, idx) => (
              <li key={idx}>
                {entry.university} - {entry.major} ({entry.period})
              </li>
            ))}
          </ul>
        ) : (
          <div>No education history available.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateEducation; 