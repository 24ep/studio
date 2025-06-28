import React from 'react';
import type { ExperienceEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CandidateExperienceProps {
  experience: ExperienceEntry[];
  // Add any handlers or state needed for editing, saving, etc.
}

const CandidateExperience: React.FC<CandidateExperienceProps> = ({ experience }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
      </CardHeader>
      <CardContent>
        {experience && experience.length > 0 ? (
          <ul>
            {experience.map((entry, idx) => (
              <li key={idx}>
                {entry.company} - {entry.position} ({entry.period})
              </li>
            ))}
          </ul>
        ) : (
          <div>No work experience available.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateExperience; 