import React from 'react';
import type { SkillEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CandidateSkillsProps {
  skills: SkillEntry[];
  // Add any handlers or state needed for editing, saving, etc.
}

const CandidateSkills: React.FC<CandidateSkillsProps> = ({ skills }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {skills && skills.length > 0 ? (
          <ul>
            {skills.map((entry, idx) => (
              <li key={idx}>
                {entry.skill_string || entry.segment_skill || 'Unnamed Skill'}
              </li>
            ))}
          </ul>
        ) : (
          <div>No skills listed.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateSkills; 