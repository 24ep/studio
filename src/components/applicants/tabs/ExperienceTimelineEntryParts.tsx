import type { ReactNode } from 'react';
import { BuildingOffice2Icon as Building2 } from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { convertMinIOUrlToSecureUrl } from '@/lib/imageUtils';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import { getExperienceDisplayCompanyLogo, getExperienceDisplayCompanyName } from '../applicant-experience-utils';
import { isVisiblePositionLevel } from './experience-tab-utils';
import type { ExperienceDisplayEntry } from './ExperienceTabTypes';

export function ExperiencePeriod({
  duration,
  periodDisplay,
}: {
  duration: string;
  periodDisplay: ReactNode;
}) {
  if (!periodDisplay && !duration) {
    return null;
  }

  return (
    <>
      {periodDisplay && <span>{periodDisplay}</span>}
      {duration && (
        <>
          <span>-</span>
          <span>{duration}</span>
        </>
      )}
    </>
  );
}

export function ExperiencePositionHeading({
  entry,
  isMobile = false,
}: {
  entry: ExperienceDisplayEntry;
  isMobile?: boolean;
}) {
  const positionLevel = isVisiblePositionLevel(entry.positionLevel)
    ? ` (${entry.positionLevel})`
    : '';

  if (isMobile) {
    return (
      <h4 className="text-sm font-semibold text-foreground leading-tight mb-1">
        {entry.position || 'Position not specified'}
        {positionLevel && <span className="text-xs text-muted-foreground font-normal">{positionLevel}</span>}
      </h4>
    );
  }

  return (
    <div className="mb-2">
      <span className="text-sm text-primary font-semibold">
        {entry.position || 'Position not specified'}
      </span>
      {positionLevel && (
        <span className="text-sm text-foreground font-semibold">
          {positionLevel}
        </span>
      )}
    </div>
  );
}

export function ExperienceCompanyLine({
  entry,
  isMobile = false,
}: {
  entry: ExperienceDisplayEntry;
  isMobile?: boolean;
}) {
  const company = getExperienceDisplayCompanyName(entry);

  if (!company) {
    return null;
  }

  const logo = getExperienceDisplayCompanyLogo(entry);
  const logoClass = isMobile ? 'h-3 w-3' : 'h-4 w-4';
  const imageUrl = logo ? convertMinIOUrlToSecureUrl(logo, {
    thumbnail: true,
    width: isMobile ? 12 : 16,
    height: isMobile ? 12 : 16,
  }) || logo : null;
  const imageClass = isMobile ? 'h-3 w-3' : 'h-4 w-4';

  const logoBadge = (
    <Avatar className={`${logoClass} rounded`}>
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={`${company} logo`}
          className={`${imageClass} object-contain rounded`}
          loading="lazy"
        />
      ) : null}
      <AvatarFallback className="bg-muted text-muted-foreground rounded">
        <Building2 className={logoClass} />
      </AvatarFallback>
    </Avatar>
  );

  if (isMobile) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {logoBadge}
        {company}
      </p>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-2">
      {logoBadge}
      <span className="text-xs text-foreground">{company}</span>
    </div>
  );
}

export function ExperienceFitScore({
  fitScore,
  isMobile = false,
}: {
  fitScore: number | null;
  isMobile?: boolean;
}) {
  if (fitScore === null) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col items-center flex-shrink-0">
        <span className="text-xl font-bold text-primary leading-none">{formatScoreWithGrade(fitScore)}</span>
        <span className="text-[10px] text-muted-foreground">{fitScore}%</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center ml-6">
      <span className="text-4xl font-extrabold text-primary leading-none">{formatScoreWithGrade(fitScore)}</span>
      <span className="text-lg text-muted-foreground font-semibold mt-1">
        {formatScoreWithGrade(fitScore)}
      </span>
    </div>
  );
}
