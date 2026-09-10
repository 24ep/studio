import type { DashboardStageRow } from './root-dashboard-initial-types';

const DASHBOARD_STAGE_ID_ALIASES: Record<string, string> = {
  applied: 'applied',
  screening: 'screening',
  shortlisted: 'shortlisted',
  'interview scheduled': 'interviewScheduled',
  interviewing: 'interviewing',
  'offer extended': 'offerExtended',
  hired: 'hired',
  'on hold': 'onHold',
  rejected: 'rejected',
};

function setStageAliases(
  stageIds: Record<string, string | undefined>,
  stageName: string,
  stageId: string
) {
  const alias = DASHBOARD_STAGE_ID_ALIASES[stageName];
  if (alias) {
    stageIds[alias] = stageId;
  }
}

export function mapDashboardStageRows(rows: DashboardStageRow[]) {
  const stageIds: Record<string, string | undefined> = {};
  const stageNames: Record<string, string> = {};

  rows.forEach((row) => {
    const name = row.name.toLowerCase();
    stageIds[name] = row.id;
    stageNames[row.id] = row.name;
    setStageAliases(stageIds, name, row.id);
  });

  return { stageIds, stageNames };
}
