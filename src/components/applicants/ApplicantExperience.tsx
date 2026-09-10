import type { ExperienceEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ApplicantExperienceTimeline } from './ApplicantExperienceTimeline';
import {
  calculateTotalExperienceDuration,
  sortExperienceByTimeline,
} from './applicant-experience-utils';

interface ApplicantExperienceProps {
  experience: ExperienceEntry[];
  embedded?: boolean;
}

export default function ApplicantExperience({ experience, embedded = false }: ApplicantExperienceProps) {
  const safeExperience = Array.isArray(experience) ? experience : [];
  const sortedExperience = sortExperienceByTimeline(safeExperience);
  const totalDuration = calculateTotalExperienceDuration(safeExperience);

  return (
    <Card className={embedded ? 'rounded-none border-0 !bg-transparent shadow-none' : undefined}>
      <CardHeader className={embedded ? 'px-0 pt-0' : undefined}>
        <CardTitle>
          Work Experience
          {totalDuration && ` (${totalDuration})`}
        </CardTitle>
      </CardHeader>
      <CardContent className={embedded ? 'px-0 pb-0' : undefined}>
        {sortedExperience.length > 0 ? (
          <ApplicantExperienceTimeline experience={sortedExperience} />
        ) : (
          <div className="text-muted-foreground text-center py-8">
            No work experience available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
