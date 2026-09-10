"use client";

import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { User } from 'lucide-react';

import { RecruiterAvatarCompact } from '@/components/ui/recruiter-avatar';
import { cn } from '@/lib/utils';
import type { RecruiterFilterRecruiter } from './recruiter-filter-sidebar-types';
import {
  getRecruiterDisplayName,
  getRecruiterFallbackColor,
  isRecruiterKeyboardActivationKey,
} from './recruiter-filter-sidebar-utils';

interface RecruiterFilterOptionProps {
  active: boolean;
  label: string;
  onSelect: () => void;
  icon: ReactNode;
  activeIconClassName?: string;
  inactiveIconClassName?: string;
}

export function RecruiterFilterOption({
  active,
  label,
  onSelect,
  icon,
  activeIconClassName = 'bg-primary/20 text-primary',
  inactiveIconClassName = 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
}: RecruiterFilterOptionProps): ReactElement {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isRecruiterKeyboardActivationKey(event.key)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center px-6 py-4 text-sm font-semibold transition-all duration-200 hover:bg-muted/80 hover:text-primary relative h-16 cursor-pointer',
        active ? 'bg-muted/60 text-primary font-bold' : 'text-muted-foreground'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('p-2 rounded-lg transition-colors shrink-0', active ? activeIconClassName : inactiveIconClassName)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <span className="truncate font-semibold text">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecruiterFilterListItem({
  recruiterId,
  recruiter,
  index,
  active,
  onSelect
}: {
  recruiterId: string;
  recruiter?: RecruiterFilterRecruiter;
  index: number;
  active: boolean;
  onSelect: () => void;
}): ReactElement {
  const recruiterName = getRecruiterDisplayName(recruiterId, recruiter);
  const recruiterColor = recruiter?.personalColor || '#3B82F6';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isRecruiterKeyboardActivationKey(event.key)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center px-6 py-4 text-sm font-semibold transition-all duration-200 hover:bg-muted/80 hover:text-primary relative h-16 cursor-pointer',
        active ? 'bg-muted/60 text-primary font-bold' : 'text-muted-foreground'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {recruiter?.avatarUrl ? (
          <RecruiterAvatarCompact
            user={{
              id: recruiterId,
              name: recruiterName,
              avatarUrl: recruiter.avatarUrl,
              personalColor: recruiterColor
            }}
            size="md"
            showBorder={active}
          />
        ) : (
          <div
            className={cn(
              'rounded-full transition-colors shrink-0 border-4',
              active ? 'bg-muted/20' : 'bg-muted/20 group-hover:bg-muted/30',
              getRecruiterFallbackColor(recruiterId, index)
            )}
            style={{
              borderColor: active ? recruiterColor : 'transparent'
            }}
          >
            <User className="h-8 w-10" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <span className="truncate font-semibold text">{recruiterName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
