import React from 'react';
import type { SkillEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ApplicantSkillsProps {
  skills: SkillEntry[];
  // Add any handlers or state needed for editing, saving, etc.
}

const ApplicantSkills: React.FC<ApplicantSkillsProps> = ({ skills }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {skills && skills.length > 0 ? (
          skills.map((entry, idx) => {
            const skillText = entry.skill_string || entry.segment_skill || 'Unnamed Skill';
            return skillText.split(',').map((s, i) => {
              const trimmed = s.trim();
              if (!trimmed) return null;
              return (
                <Badge key={`${idx}-${i}`} variant="secondary">
                  {trimmed}
                </Badge>
              );
            });
          })
        ) : (
          <div className="text-muted-foreground text-sm">No skills listed.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicantSkills; 