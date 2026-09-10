'use client';

import * as React from 'react';

export type FinancialDimensionOption = {
  id: string;
  code: string;
  name: string;
  costCenterId?: string | null;
};

export function useFinancialDimensions() {
  const [costCenters, setCostCenters] = React.useState<FinancialDimensionOption[]>([]);
  const [projects, setProjects] = React.useState<FinancialDimensionOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/hr/master-data/cost-centers?activeOnly=true', { cache: 'no-store' }),
      fetch('/api/hr/master-data/projects?activeOnly=true', { cache: 'no-store' }),
    ]).then(async ([costCenterResponse, projectResponse]) => {
      if (!costCenterResponse.ok || !projectResponse.ok) return;
      const [costCenterBody, projectBody] = await Promise.all([costCenterResponse.json(), projectResponse.json()]);
      if (!active) return;
      setCostCenters(Array.isArray(costCenterBody.data) ? costCenterBody.data : []);
      setProjects(Array.isArray(projectBody.data) ? projectBody.data : []);
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { costCenters, projects, loading };
}

