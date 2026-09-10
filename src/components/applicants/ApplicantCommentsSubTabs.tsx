import type { ReactNode } from 'react';
import {
  ChartBarIcon as Activity,
  ChatBubbleLeftRightIcon as MessageSquare,
  DocumentIcon as FileIcon,
} from '@heroicons/react/24/outline';

import { cn } from '@/lib/utils';
import type {
  ApplicantCommentChannel,
  ApplicantCommentsTab,
} from './applicant-comments-utils';

interface ApplicantCommentCounts {
  all: number;
  comment: number;
  remark: number;
  activity: number;
}

interface ApplicantCommentsSubTabsProps {
  activeTab: ApplicantCommentsTab;
  counts: ApplicantCommentCounts;
  canViewAllComments: boolean;
  canViewRemarksOnly: boolean;
  canViewActivities: boolean;
  onTabChange: (tab: ApplicantCommentsTab, channel: ApplicantCommentChannel) => void;
}

function ApplicantCommentsSubTabButton({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs font-medium transition-colors',
        active
          ? 'border-0 bg-blue-600 text-white hover:bg-blue-600'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted hover:text-foreground',
      )}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold',
            active
              ? 'bg-white/20 text-white'
              : 'bg-muted text-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function ApplicantCommentsSubTabs({
  activeTab,
  counts,
  canViewAllComments,
  canViewRemarksOnly,
  canViewActivities,
  onTabChange,
}: ApplicantCommentsSubTabsProps) {
  return (
    <div className="mb-5 flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
      {canViewAllComments && (
        <ApplicantCommentsSubTabButton
          active={activeTab === 'all'}
          count={counts.all}
          icon={<FileIcon className="h-3.5 w-3.5" />}
          label="All"
          onClick={() => onTabChange('all', 'comment')}
        />
      )}

      {canViewAllComments && (
        <ApplicantCommentsSubTabButton
          active={activeTab === 'comment'}
          count={counts.comment}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Comment"
          onClick={() => onTabChange('comment', 'comment')}
        />
      )}

      {(canViewAllComments || canViewRemarksOnly) && (
        <ApplicantCommentsSubTabButton
          active={activeTab === 'remark'}
          count={counts.remark}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Remark"
          onClick={() => onTabChange('remark', 'remark')}
        />
      )}

      {canViewActivities && (
        <ApplicantCommentsSubTabButton
          active={activeTab === 'activity'}
          count={counts.activity}
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Activity"
          onClick={() => onTabChange('activity', 'activity')}
        />
      )}
    </div>
  );
}
