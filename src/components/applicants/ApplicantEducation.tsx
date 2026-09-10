import React from 'react';
import type { EducationEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AcademicCapIcon as GraduationCap } from '@heroicons/react/24/outline';
import {
  formatEducationTimelineDuration,
  getEducationFieldLabel,
  getEducationInstitutionLabel,
  getEducationTimelineLabels,
  sortEducationByTimeline,
  type EducationTimelineLabels,
} from './applicant-education-utils';

interface ApplicantEducationProps {
  education: EducationEntry[];
  embedded?: boolean;
}

function renderTimelineLabel(label: string | null) {
  return label ? <span className="font-bold">{label}</span> : null;
}

function renderTimelinePeriod({ startLabel, endLabel }: EducationTimelineLabels) {
  const left = renderTimelineLabel(startLabel);
  const right = renderTimelineLabel(endLabel);

  if (!left && !right) return null;
  if (!left) return right;
  if (!right) return left;

  return <>{left} - {right}</>;
}

const ApplicantEducation: React.FC<ApplicantEducationProps> = ({ education, embedded = false }) => {
  const sortedEducation = sortEducationByTimeline(education);

  return (
    <Card className={embedded ? 'rounded-none border-0 !bg-transparent shadow-none' : undefined}>
      <CardHeader className={embedded ? 'px-0 pt-0' : undefined}>
        <CardTitle>Education History</CardTitle>
      </CardHeader>
      <CardContent className={embedded ? 'px-0 pb-0' : undefined}>
        {sortedEducation && sortedEducation.length > 0 ? (
          <div className="relative">
            {/* Continuous vertical line that connects all nodes */}
            <div className="absolute left-4 top-8 w-0.5 bg-border" style={{ height: `${(sortedEducation.length - 1) * 40 + 24}px` }} />

            {sortedEducation.map((entry, idx) => {
              const periodDisplay = renderTimelinePeriod(getEducationTimelineLabels(entry));
              const duration = formatEducationTimelineDuration(entry);
              return (
                <div key={idx} className="relative">
                  {/* Timeline item */}
                  <div className="flex items-start space-x-4">
                    {/* Cycle node */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          {getEducationFieldLabel(entry)}
                        </p>
                        <h4 className="font-semibold text-foreground mb-1">
                          {getEducationInstitutionLabel(entry)}
                        </h4>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {periodDisplay && (
                            <span>{periodDisplay}</span>
                          )}
                          {duration && (
                            <span>{duration}</span>
                          )}
                          {entry.GPA && (
                            <span>GPA: {entry.GPA}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-8">
            No education history available.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicantEducation; 
