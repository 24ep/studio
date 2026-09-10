import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  getStatusBadgeColorClass,
  getStatusBadgeDisplayText,
  getStatusBadgeKey,
  getStatusBadgeStageName,
  isRecruitmentStageColorResponse,
  shouldFetchStatusBadgeColor,
} from './applicant-status-badge-utils';

export interface StatusBadgeProps {
  status?: string | null;
  statusId?: string | null;
  className?: string;
  stageNames?: Record<string, string>;
  stageColors?: Record<string, string>;
}

const EMPTY_STAGE_NAMES: Record<string, string> = {};
const EMPTY_STAGE_COLORS: Record<string, string> = {};

async function fetchStageColor(statusId: string) {
  const response = await fetch(`/api/settings/recruitment-stages?ids=${statusId}`);
  if (!response.ok) {
    return null;
  }

  const stages = await readJsonOrFallback<unknown>(response, []);
  const stage = Array.isArray(stages)
    ? stages.filter(isRecruitmentStageColorResponse).find((item) => item.id === statusId)
    : undefined;

  return stage?.color_badge ?? null;
}

export function StatusBadge({
  status,
  statusId,
  className = '',
  stageNames = EMPTY_STAGE_NAMES,
  stageColors = EMPTY_STAGE_COLORS,
}: StatusBadgeProps) {
  const [localStageColors, setLocalStageColors] = useState<Record<string, string>>(stageColors);
  const statusKey = getStatusBadgeKey(status, statusId);
  const stageName = useMemo(
    () => getStatusBadgeStageName(statusKey, stageNames),
    [statusKey, stageNames],
  );
  const colorClass = useMemo(
    () => getStatusBadgeColorClass({ localStageColors, stageName, statusKey }),
    [localStageColors, stageName, statusKey],
  );
  const displayText = getStatusBadgeDisplayText({ stageName, status, statusId });

  useEffect(() => {
    if (shouldFetchStatusBadgeColor(statusKey, stageColors)) {
      const loadStageColor = async () => {
        try {
          const stageColor = await fetchStageColor(statusKey as string);
          if (stageColor) {
            setLocalStageColors({ [statusKey as string]: stageColor });
          }
        } catch (error) {
          console.error('Error fetching stage color:', error);
        }
      };

      loadStageColor();
    } else {
      setLocalStageColors(stageColors);
    }
  }, [statusKey, stageColors]);

  return (
    <Badge className={cn('text-xs px-2 py-1 flex-shrink-0', className, colorClass)}>
      {displayText}
    </Badge>
  );
}
