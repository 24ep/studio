import { useEffect, useState } from 'react';

import type { Applicant } from '@/lib/types';
import {
  fetchDashboardStageNameMap,
  getUniqueApplicantStageIds,
} from './dashboard-stage-names-api';

export function useDashboardStageNames({
  applicants,
  initialStageNames,
}: {
  applicants: Applicant[];
  initialStageNames: Record<string, string>;
}) {
  const [stageNames, setStageNames] = useState<Record<string, string>>(initialStageNames);

  useEffect(() => {
    setStageNames(initialStageNames);
  }, [initialStageNames]);

  useEffect(() => {
    const fetchStageNames = async () => {
      try {
        const uniqueStageIds = getUniqueApplicantStageIds(applicants.map(applicant => applicant.status));
        const stageMap = await fetchDashboardStageNameMap(uniqueStageIds);
        if (Object.keys(stageMap).length > 0) {
          setStageNames(stageMap);
        }
      } catch (error) {
        console.error('Error fetching stage names:', error);
      }
    };

    void fetchStageNames();
  }, [applicants]);

  return stageNames;
}
