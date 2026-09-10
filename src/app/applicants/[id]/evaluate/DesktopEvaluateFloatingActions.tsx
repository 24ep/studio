"use client";

import { Button } from '@/components/ui/button';
import { BarChart3, MessageSquare } from 'lucide-react';
import {
  getDesktopEvaluateRemarkButtonClassName,
  getDesktopEvaluateRemarkDisplayText,
} from './utils';
import { buildEvaluateHeaderStyle } from './DesktopEvaluateHeaderUtils';
import type { DesktopFloatingActionsProps } from './DesktopEvaluatePagePartTypes';

export function DesktopEvaluateFloatingActions({
  allEvaluationsComplete,
  canEditRemark,
  remarkText,
  onReportClick,
  onRemarkClick,
  ...themeProps
}: DesktopFloatingActionsProps) {
  const dynamicStyle = buildEvaluateHeaderStyle(themeProps);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {allEvaluationsComplete && (
        <Button
          size="lg"
          onClick={onReportClick}
          className="h-14 px-6 rounded-full shadow-lg flex items-center justify-center gap-2"
          style={dynamicStyle}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">See Report</span>
        </Button>
      )}

      <Button
        onClick={onRemarkClick}
        onKeyDown={(event) => {
          if (!canEditRemark) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onRemarkClick();
          }
        }}
        disabled={!canEditRemark}
        variant="outline"
        className={getDesktopEvaluateRemarkButtonClassName(canEditRemark)}
      >
        <div className="flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 bg-gray-100">
          <MessageSquare className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide mb-1 text-gray-500">Remark to interviewer</p>
          <p className="text-sm font-semibold leading-snug line-clamp-4 break-words whitespace-pre-wrap text-gray-900">
            {getDesktopEvaluateRemarkDisplayText(remarkText)}
          </p>
        </div>
        {canEditRemark && (
          <span className="text-xs font-semibold whitespace-nowrap text-gray-700">Edit</span>
        )}
      </Button>
    </div>
  );
}
