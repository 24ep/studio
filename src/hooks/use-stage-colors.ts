import { useState, useEffect } from 'react';
import type { RecruitmentStage } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';

type StageColorRow = Pick<RecruitmentStage, 'id' | 'color_badge'>;

// Custom hook to fetch and cache stage colors
export function useStageColors(stageIds: string[]) {
  const [stageColors, setStageColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStageColors = async () => {
      if (stageIds.length === 0) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/settings/recruitment-stages?ids=${stageIds.join(',')}`);
        if (response.ok) {
          const stages = await readJsonOrFallback<StageColorRow[]>(response, []);
          const colorMap: Record<string, string> = {};
          const safeStages = Array.isArray(stages) ? stages : [];
          safeStages.forEach((stage) => {
            if (stage.color_badge) {
              colorMap[stage.id] = stage.color_badge;
            }
          });
          setStageColors(colorMap);
        }
      } catch (error) {
        console.error('Error fetching stage colors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStageColors();
  }, [stageIds.join(',')]);

  return { stageColors, isLoading };
}
