import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AcademicCapIcon as GraduationCap } from '@heroicons/react/24/outline';
import {
  formatEducationFitGrade,
  getEducationTimelineDisplay,
  hasEducationFitScore,
} from './education-tab-utils';
import type { EducationDisplayEntry } from './EducationTabTypes';

function renderTimelinePeriod(display: { startLabel: string; endLabel: string | null } | null) {
  if (!display) return null;

  return (
    <>
      <span className="font-bold">{display.startLabel}</span>
      {display.endLabel && (
        <>
          {' - '}
          <span className="font-bold">{display.endLabel}</span>
        </>
      )}
    </>
  );
}

function EducationTimelineDesktopEntry({
  education,
  edu,
  index,
  periodDisplay,
  duration,
}: {
  education: unknown[];
  edu: EducationDisplayEntry;
  index: number;
  periodDisplay: ReactNode;
  duration: string;
}) {
  return (
    <div className="hidden md:grid grid-cols-[12rem_4rem_1fr] gap-x-2 items-stretch h-full">
      <div className="text-right h-full flex flex-col items-end justify-start">
        {periodDisplay && (
          <div className="text-xs text-muted-foreground mb-1">{periodDisplay}</div>
        )}
        {duration && (
          <div className="text-xs text-muted-foreground">{duration}</div>
        )}
      </div>
      <div className="flex flex-col items-center h-full">
        <div className="w-10 h-10 bg-muted rounded-full bg-card flex items-center justify-center z-10 border-border relative">
          <GraduationCap className="w-6 h-6 text-foreground" />
        </div>
        {index < education.length - 1 && (
          <div className="w-px bg-border flex-grow" />
        )}
      </div>
      <div className="bg-muted/50 rounded-lg p-4 flex-1 flex items-center min-w-0 mb-8">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {edu.major && edu.field ? `${edu.major} - ${edu.field}` : edu.major || edu.field || 'Field of study not specified'}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            {edu.university || 'University not specified'}
            {edu.campus && ` (${edu.campus})`}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {edu.GPA && (
              <span className="text-xs">GPA: {edu.GPA}</span>
            )}
          </div>
        </div>
        {hasEducationFitScore(edu) && (
          <div className="flex flex-col items-center justify-center ml-6">
            <span className="text-4xl font-extrabold text-primary leading-none">{formatEducationFitGrade(edu.fitScore)}</span>
            <span className="text-lg text-muted-foreground font-semibold mt-1">{edu.fitScore}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EducationTimelineMobileEntry({
  edu,
  periodDisplay,
  duration,
}: {
  edu: EducationDisplayEntry;
  periodDisplay: ReactNode;
  duration: string;
}) {
  return (
    <div className="md:hidden mb-4">
      <div className="bg-muted/30 rounded-lg p-3 border border-border">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground leading-tight mb-1">
              {edu.major && edu.field ? `${edu.major} - ${edu.field}` : edu.major || edu.field || 'Field of study not specified'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {edu.university || 'University not specified'}
              {edu.campus && ` (${edu.campus})`}
            </p>
          </div>
          {hasEducationFitScore(edu) && (
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-xl font-bold text-primary leading-none">{formatEducationFitGrade(edu.fitScore)}</span>
              <span className="text-[10px] text-muted-foreground">{edu.fitScore}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
          {periodDisplay && (
            <span>{periodDisplay}</span>
          )}
          {duration && (
            <>
              <span aria-hidden="true">&bull;</span>
              <span>{duration}</span>
            </>
          )}
          {edu.GPA && (
            <>
              <span aria-hidden="true">&bull;</span>
              <span>GPA: {edu.GPA}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function EducationTimelineCard({ education }: { education: unknown[] }) {
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Education</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-8">
          {education.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">No education details provided.</div>
          )}
          {education.map((entry, index) => {
            const edu = entry as EducationDisplayEntry;
            const timeline = getEducationTimelineDisplay(edu);
            const periodDisplay = renderTimelinePeriod(timeline);
            const duration = timeline?.duration || '';
            return (
              <div key={`edu-${index}-${edu.university || index}`} className="relative">
                <EducationTimelineDesktopEntry
                  education={education}
                  edu={edu}
                  index={index}
                  periodDisplay={periodDisplay}
                  duration={duration}
                />
                <EducationTimelineMobileEntry
                  edu={edu}
                  periodDisplay={periodDisplay}
                  duration={duration}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
