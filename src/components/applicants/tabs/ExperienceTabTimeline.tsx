import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExperienceDisplayCompanyName } from '../applicant-experience-utils';
import { ExperienceTimelineEntry } from './ExperienceTimelineEntries';
import type { ExperienceDisplayEntry } from './ExperienceTabTypes';

interface ExperienceTabTimelineProps {
  experience: unknown[];
  totalDuration: string;
}

export function ExperienceTabTimeline({
  experience,
  totalDuration,
}: ExperienceTabTimelineProps) {
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>
          Experience
          {totalDuration && ` (${totalDuration})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-8">
          {experience.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No experience details provided.</div>
          )}
          {experience.map((entry, index: number) => (
            <ExperienceTimelineEntry
              key={`exp-${index}-${getExperienceDisplayCompanyName(entry as ExperienceDisplayEntry) || index}`}
              entry={entry as ExperienceDisplayEntry}
              isLast={index >= experience.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
