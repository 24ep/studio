import type { ReactNode } from 'react';
import { BriefcaseIcon as Briefcase } from '@heroicons/react/24/outline';

import {
  getExperienceFitScoreValue,
  getExperienceTimelineDisplay,
} from './experience-tab-utils';
import {
  ExperienceCompanyLine,
  ExperienceFitScore,
  ExperiencePeriod,
  ExperiencePositionHeading,
} from './ExperienceTimelineEntryParts';
import type { ExperienceDisplayEntry } from './ExperienceTabTypes';

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

export function ExperienceTimelineEntry({
  entry,
  isLast,
}: {
  entry: ExperienceDisplayEntry;
  isLast: boolean;
}) {
  const timeline = getExperienceTimelineDisplay(entry);
  const periodDisplay = renderTimelinePeriod(timeline);
  const duration = timeline?.duration || '';
  const fitScore = getExperienceFitScoreValue(entry);

  return (
    <div className="relative">
      <DesktopExperienceEntry
        entry={entry}
        periodDisplay={periodDisplay}
        duration={duration}
        fitScore={fitScore}
        isLast={isLast}
      />
      <MobileExperienceEntry
        entry={entry}
        periodDisplay={periodDisplay}
        duration={duration}
        fitScore={fitScore}
      />
    </div>
  );
}

function DesktopExperienceEntry({
  entry,
  periodDisplay,
  duration,
  fitScore,
  isLast,
}: {
  entry: ExperienceDisplayEntry;
  periodDisplay: ReactNode;
  duration: string;
  fitScore: number | null;
  isLast: boolean;
}) {
  return (
    <div className="hidden md:grid grid-cols-[12rem_4rem_1fr] gap-x-2 items-stretch h-full">
      <div className="text-right h-full flex flex-col items-end justify-start">
        {periodDisplay && <div className="text-xs text-muted-foreground mb-1">{periodDisplay}</div>}
        {duration && <div className="text-xs text-muted-foreground">{duration}</div>}
      </div>
      <div className="flex flex-col items-center h-full">
        <div className="w-10 h-10 bg-muted rounded-full bg-card flex items-center justify-center z-10 border-border relative">
          <Briefcase className="w-6 h-6 text-foreground" />
        </div>
        {!isLast && <div className="w-px bg-border flex-grow" />}
      </div>
      <div className="bg-muted/50 rounded-lg p-4 flex-1 flex items-center min-w-0 mb-8">
        <ExperienceEntryContent entry={entry} />
        <ExperienceFitScore fitScore={fitScore} />
      </div>
    </div>
  );
}

function ExperienceEntryContent({ entry }: { entry: ExperienceDisplayEntry }) {
  return (
    <div className="flex-1">
      <ExperiencePositionHeading entry={entry} />
      <ExperienceCompanyLine entry={entry} />
      {entry.description && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Description:</h4>
          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {entry.description}
          </p>
        </div>
      )}
    </div>
  );
}

function MobileExperienceEntry({
  entry,
  periodDisplay,
  duration,
  fitScore,
}: {
  entry: ExperienceDisplayEntry;
  periodDisplay: ReactNode;
  duration: string;
  fitScore: number | null;
}) {
  return (
    <div className="md:hidden mb-4">
      <div className="bg-muted/30 rounded-lg p-3 border border-border">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <ExperiencePositionHeading entry={entry} isMobile />
            <ExperienceCompanyLine entry={entry} isMobile />
          </div>
          <ExperienceFitScore fitScore={fitScore} isMobile />
        </div>

        {(periodDisplay || duration) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
            <ExperiencePeriod duration={duration} periodDisplay={periodDisplay} />
          </div>
        )}

        {entry.description && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {entry.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
