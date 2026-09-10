"use client";

import {
  BellIcon,
  ChartBarIcon as Activity,
  ChatBubbleLeftRightIcon as MessageSquare,
} from '@heroicons/react/24/outline';

import type { CombinedActivityItem } from './applicant-comments-utils';

export function ApplicantActivityIcon({ item }: { item: CombinedActivityItem }) {
  if (item.rawType === 'remark') {
    return (
      <div className="px-1.5 py-0.5 bg-purple-500/10 dark:bg-purple-400/20 rounded-lg w-8 h-8 flex items-center justify-center">
        <MessageSquare className="w-3 h-3 text-purple-600 dark:text-purple-300" />
      </div>
    );
  }

  if (item.rawType === 'reminder') {
    return (
      <div className="px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-400/20 rounded-lg w-8 h-8 flex items-center justify-center">
        <BellIcon className="w-3 h-3 text-amber-600 dark:text-amber-300" />
      </div>
    );
  }

  if (item.type === 'comment') {
    return (
      <div className="px-1.5 py-0.5 bg-blue-500/10 dark:bg-blue-400/20 rounded-lg w-8 h-8 flex items-center justify-center">
        <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-300" />
      </div>
    );
  }

  return (
    <div className="px-1.5 py-0.5 bg-green-500/10 dark:bg-green-400/20 rounded-lg w-8 h-8 flex items-center justify-center">
      <Activity className="w-3 h-3 text-green-600 dark:text-green-300" />
    </div>
  );
}

export function ApplicantActivityTypeBadge({ item }: { item: CombinedActivityItem }) {
  if (item.rawType === 'remark') {
    return <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">Remark to HM</span>;
  }

  if (item.rawType === 'activity') {
    return <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">Activity Log</span>;
  }

  if (item.rawType === 'reminder') {
    return <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">Reminder</span>;
  }

  return null;
}
