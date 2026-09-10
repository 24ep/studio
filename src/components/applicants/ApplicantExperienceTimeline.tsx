import { BuildingOffice2Icon as Building2, BriefcaseIcon as Briefcase } from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import type { ExperienceEntry } from '@/lib/types';
import { getExperienceDisplayCompanyLogo, getExperienceDisplayCompanyName } from './applicant-experience-utils';

import {
  formatExperienceEntryDuration,
  getExperiencePeriodDisplay,
} from './applicant-experience-utils';
import { isVisiblePositionLevel } from './tabs/experience-tab-utils';

interface ApplicantExperienceTimelineProps {
  experience: ExperienceEntry[];
}

export function ApplicantExperienceTimeline({ experience }: ApplicantExperienceTimelineProps) {
  return (
    <div className="relative">
      {experience.map((entry, index) => (
        <ExperienceTimelineItem
          key={`${getExperienceDisplayCompanyName(entry) ?? 'company'}-${entry.position ?? 'position'}-${index}`}
          entry={entry}
          isLast={index === experience.length - 1}
        />
      ))}
    </div>
  );
}

function ExperienceTimelineItem({
  entry,
  isLast,
}: {
  entry: ExperienceEntry;
  isLast: boolean;
}) {
  const periodDisplay = getExperiencePeriodDisplay(entry);
  const duration = formatExperienceEntryDuration(entry);

  return (
    <div className="relative">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0 pb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <ExperienceEntryContent entry={entry} />
            {(periodDisplay || duration) && (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                {periodDisplay && <span>{renderPeriodDisplay(periodDisplay)}</span>}
                {duration && <span>{duration}</span>}
              </div>
            )}
            {entry.description && <ExperienceDescription description={entry.description} />}
          </div>
        </div>
      </div>
      {!isLast && <ExperienceTimelineConnector />}
    </div>
  );
}

function ExperienceEntryContent({ entry }: { entry: ExperienceEntry }) {
  const company = getExperienceDisplayCompanyName(entry);
  const logo = getExperienceDisplayCompanyLogo(entry);
  const imageUrl = logo ? convertMinIOUrlToSecureUrl(logo, {
    thumbnail: true,
    width: 16,
    height: 16,
  }) || logo : null;

  return (
    <>
      <div className="mb-2">
        <span className="text-primary font-semibold">
          {entry.position || 'Position not specified'}
        </span>
        {isVisiblePositionLevel(entry.positionLevel) && (
          <span className="text-foreground font-semibold">
            {' '}({entry.positionLevel})
          </span>
        )}
      </div>
      {company && (
        <div className="mb-3 flex items-center gap-2">
          <Avatar className="h-4 w-4 rounded">
            {imageUrl ? (
              <AvatarImage
                src={imageUrl}
                alt={`${company} logo`}
                className="h-4 w-4 object-contain rounded"
                loading="lazy"
              />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground rounded">
              <Building2 className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground">{company}</span>
        </div>
      )}
    </>
  );
}

function ExperienceDescription({ description }: { description: string }) {
  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Description:</h4>
      <p className="text-sm text-foreground whitespace-pre-wrap bg-card p-3 rounded border">
        {description}
      </p>
    </div>
  );
}

function ExperienceTimelineConnector() {
  return <div className="absolute left-4 top-8 w-0.5 h-6 bg-border" />;
}

function renderPeriodDisplay(display: { startLabel: string | null; endLabel: string | null }) {
  if (!display.startLabel && !display.endLabel) return null;
  if (!display.startLabel) return <span className="font-bold">{display.endLabel}</span>;
  if (!display.endLabel) return <span className="font-bold">{display.startLabel}</span>;

  return (
    <>
      <span className="font-bold">{display.startLabel}</span>
      {' - '}
      <span className="font-bold">{display.endLabel}</span>
    </>
  );
}
